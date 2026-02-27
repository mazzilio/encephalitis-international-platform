"""
Enhanced Live Monitoring Server for Resource Classification
Matches the web-scraper UI with all advanced features

FEATURES:
- Sitemap XML display
- Content by Stage (horizontal bar chart)
- Target Personas (pie chart)
- Medical Types (bar chart)
- Topics Coverage (horizontal bar chart)
- Processing Queue with live status
- Export data functionality
- Real-time progress tracking

USAGE:
    python3 monitoring_server_enhanced.py
    
    Then open: http://localhost:5001
"""

from flask import Flask, jsonify, render_template_string, send_file
from flask_cors import CORS
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import threading
import time
import io

app = Flask(__name__)
CORS(app)

# Configuration - Use paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent
CHECKPOINT_FILE = PROJECT_ROOT / 'temp' / 'progress_checkpoint.json'
CHECKPOINT_FILE_CACHED = PROJECT_ROOT / 'temp' / 'progress_checkpoint_cached.json'
REFRESH_INTERVAL = 2  # seconds

# Global state
monitoring_data = {
    'last_update': None,
    'checkpoint': None,
    'stats': None,
    'is_running': False,
    'queue_items': []
}

def load_checkpoint() -> Dict[str, Any]:
    """Load the most recent checkpoint file"""
    for checkpoint_file in [CHECKPOINT_FILE, CHECKPOINT_FILE_CACHED]:
        if checkpoint_file.exists():
            try:
                with open(checkpoint_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading {checkpoint_file}: {e}")
    return None

def calculate_stats(checkpoint: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate comprehensive statistics from checkpoint data"""
    if not checkpoint or 'results' not in checkpoint:
        return None
    
    results = checkpoint['results']
    metadata = checkpoint.get('metadata', {})
    
    # Basic stats
    total = len(results)
    successful = len([r for r in results if 'error' not in r])
    errors = len([r for r in results if 'error' in r])
    
    # Tag statistics with detailed counting
    personas = {}
    stages = {}
    topics = {}
    types = {}
    
    for result in results:
        if 'error' in result:
            continue
        
        refined = result.get('refined', {})
        tags = refined.get('refined_tags', {})
        
        # Count personas
        for persona in tags.get('personas', []):
            clean_name = persona.replace('persona:', '').replace('_', ' ').title()
            personas[clean_name] = personas.get(clean_name, 0) + 1
        
        # Count stages
        for stage in tags.get('stages', []):
            clean_name = stage.replace('stage:', '').replace('_', ' ').title()
            stages[clean_name] = stages.get(clean_name, 0) + 1
        
        # Count topics
        for topic in tags.get('topics', []):
            clean_name = topic.replace('topic:', '').replace('_', ' ').title()
            topics[clean_name] = topics.get(clean_name, 0) + 1
        
        # Count types (medical types)
        for type_tag in tags.get('types', []):
            clean_name = type_tag.replace('type:', '').replace('_', ' ').title()
            types[clean_name] = types.get(clean_name, 0) + 1
    
    # Progress calculation
    last_processed = metadata.get('last_processed', total)
    total_expected = metadata.get('total', total)
    progress_pct = (last_processed / total_expected * 100) if total_expected > 0 else 0
    items_left = total_expected - last_processed
    
    # Confidence scores
    confidence_scores = []
    for result in results:
        if 'error' not in result:
            refined = result.get('refined', {})
            score = refined.get('confidence_score', 0)
            if score == 0 or score is None:
                scores_obj = refined.get('confidence_scores', {})
                if isinstance(scores_obj, dict):
                    score = scores_obj.get('overall_classification', 0)
            if score > 0:
                confidence_scores.append(score)
    
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    return {
        'total': total,
        'successful': successful,
        'errors': errors,
        'success_rate': (successful / total * 100) if total > 0 else 0,
        'progress': {
            'processed': last_processed,
            'total': total_expected,
            'percentage': progress_pct,
            'items_left': items_left,
            'completed': metadata.get('completed', False)
        },
        'tags': {
            'personas': dict(sorted(personas.items(), key=lambda x: x[1], reverse=True)),
            'stages': dict(sorted(stages.items(), key=lambda x: x[1], reverse=True)),
            'topics': dict(sorted(topics.items(), key=lambda x: x[1], reverse=True)[:10]),
            'types': dict(sorted(types.items(), key=lambda x: x[1], reverse=True))
        },
        'confidence': {
            'average': round(avg_confidence, 1),
            'count': len(confidence_scores)
        },
        'timestamp': checkpoint.get('timestamp', datetime.now().isoformat())
    }

def get_queue_items(checkpoint: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get processing queue items with status"""
    if not checkpoint or 'results' not in checkpoint:
        return []
    
    results = checkpoint['results'][-20:]  # Last 20 items
    
    queue_items = []
    for result in results:
        original = result.get('original', {})
        refined = result.get('refined', {})
        tags = refined.get('refined_tags', {})
        
        # Get classification tags
        classification_tags = []
        for persona in tags.get('personas', [])[:2]:
            classification_tags.append({
                'label': persona.replace('persona:', '').replace('_', ' '),
                'type': 'persona'
            })
        for type_tag in tags.get('types', [])[:2]:
            classification_tags.append({
                'label': type_tag.replace('type:', '').replace('_', ' '),
                'type': 'type'
            })
        
        queue_items.append({
            'url': original.get('url', original.get('title', 'Unknown'))[:60],
            'status': 'error' if 'error' in result else 'completed',
            'classification': classification_tags,
            'processed_at': result.get('processed_at', '')
        })
    
    return queue_items

def monitor_checkpoint():
    """Background thread to monitor checkpoint file"""
    global monitoring_data
    
    while True:
        try:
            checkpoint = load_checkpoint()
            if checkpoint:
                stats = calculate_stats(checkpoint)
                queue_items = get_queue_items(checkpoint)
                
                monitoring_data['checkpoint'] = checkpoint
                monitoring_data['stats'] = stats
                monitoring_data['queue_items'] = queue_items
                monitoring_data['last_update'] = datetime.now().isoformat()
                monitoring_data['is_running'] = not checkpoint.get('metadata', {}).get('completed', False)
        except Exception as e:
            print(f"Error in monitoring thread: {e}")
        
        time.sleep(REFRESH_INTERVAL)

# API Endpoints

@app.route('/api/status')
def get_status():
    """Get current processing status"""
    # Detect model from checkpoint or default to Claude Opus 4.5
    model_name = "Claude Opus 4.5"
    checkpoint = monitoring_data.get('checkpoint')
    if checkpoint:
        metadata = checkpoint.get('metadata', {})
        model_name = metadata.get('model', 'Claude Opus 4.5')
    
    return jsonify({
        'last_update': monitoring_data['last_update'],
        'is_running': monitoring_data['is_running'],
        'stats': monitoring_data['stats'],
        'queue_items': monitoring_data['queue_items'],
        'model_name': model_name
    })

@app.route('/api/export')
def export_data():
    """Export current data as JSON"""
    checkpoint = monitoring_data.get('checkpoint')
    if not checkpoint:
        return jsonify({'error': 'No data available'}), 404
    
    # Create export file
    export_data = {
        'exported_at': datetime.now().isoformat(),
        'stats': monitoring_data['stats'],
        'results': checkpoint.get('results', [])
    }
    
    # Return as downloadable file
    output = io.BytesIO()
    output.write(json.dumps(export_data, indent=2).encode('utf-8'))
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/json',
        as_attachment=True,
        download_name=f'classification_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )

# Enhanced Dashboard HTML

DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Real-time monitoring dashboard for Encephalitis International resource classification">
    <title>Encephalitis Content Classifier - Live Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Skip to main content link for keyboard navigation */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
        }
        .skip-link:focus {
            top: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            padding: 0;
            font-size: 16px; /* Increased from 14px for better readability */
            line-height: 1.5;
            color: #202124; /* Darker text for better contrast */
        }
        .header {
            background: #1a73e8; /* Darker blue for better contrast */
            color: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            /* ARIA label will provide text alternative */
        }
        .header h1 {
            font-size: 20px;
            font-weight: 500;
        }
        .header-subtitle {
            font-size: 14px; /* Increased from 12px */
            opacity: 1; /* Full opacity for better contrast */
        }
        .header-right {
            font-size: 14px;
            opacity: 1; /* Full opacity for better contrast */
        }
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: 320px 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .grid-row-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        @media (max-width: 1200px) {
            .grid {
                grid-template-columns: 1fr;
            }
            .grid-row-2 {
                grid-template-columns: 1fr;
            }
        }
        .card {
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            height: 320px;
            display: flex;
            flex-direction: column;
        }
        .card h2 {
            color: #202124; /* Darker for better contrast (was #5f6368) */
            font-size: 14px; /* Increased from 12px */
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .sitemap-box {
            background: #f8f9fa;
            border: 1px solid #dadce0; /* Darker border for better contrast */
            border-radius: 4px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 12px; /* Increased from 10px */
            color: #202124; /* Darker text */
            max-height: 200px;
            overflow-y: auto;
            line-height: 1.5;
        }
        .sitemap-box .url {
            color: #1967d2; /* Darker blue for better contrast */
            word-break: break-all;
        }
        .load-example {
            color: #1967d2; /* Darker blue for better contrast */
            cursor: pointer;
            font-size: 13px; /* Increased from 11px */
            margin-bottom: 8px;
            display: inline-block;
            text-decoration: underline; /* Added for better link identification */
        }
        .load-example:hover,
        .load-example:focus {
            color: #174ea6; /* Even darker on hover/focus */
            outline: 2px solid #1967d2;
            outline-offset: 2px;
        }
        .chart-container {
            position: relative;
            flex: 1;
            min-height: 200px;
            margin-top: 6px;
        }
        .chart-container canvas {
            max-height: 100%;
            width: 100% !important;
            height: 100% !important;
        }
        .progress-section {
            margin: 15px 0 10px 0;
        }
        .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 14px; /* Increased from 12px */
            color: #202124; /* Darker text */
            margin-bottom: 6px;
            font-weight: 500;
        }
        .progress-bar {
            width: 100%;
            height: 12px; /* Increased from 8px for better visibility */
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            /* ARIA attributes will provide accessible progress info */
        }
        .progress-fill {
            height: 100%;
            background: #1967d2; /* Darker blue for better contrast */
            transition: width 0.3s ease;
        }
        .progress-text {
            font-size: 13px; /* Increased from 11px */
            color: #202124; /* Darker text */
            margin-top: 4px;
        }
        .queue-section {
            grid-column: 1 / -1;
            min-height: 300px;
        }
        .queue-table-wrapper {
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
        .queue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .queue-count {
            font-size: 14px; /* Increased from 12px */
            color: #202124; /* Darker text */
            font-weight: 500;
        }
        .queue-table {
            width: 100%;
            border-collapse: collapse;
        }
        .queue-table th {
            text-align: left;
            font-size: 13px; /* Increased from 11px */
            font-weight: 600;
            color: #202124; /* Darker text */
            text-transform: uppercase;
            padding: 10px;
            border-bottom: 2px solid #dadce0; /* Darker border */
            background: #f8f9fa;
        }
        .queue-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #dadce0; /* Darker border */
            font-size: 14px; /* Increased from 13px */
            color: #202124; /* Darker text */
        }
        .status-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
        }
        .status-completed {
            background: #e6f4ea;
            color: #137333; /* Darker green for better contrast */
        }
        .status-error {
            background: #fce8e6;
            color: #c5221f; /* Darker red for better contrast */
        }
        .url-cell {
            color: #1967d2; /* Darker blue for better contrast */
            font-size: 14px;
            max-width: 500px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .tag {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px; /* Increased from 11px */
            font-weight: 500;
            margin-right: 5px;
            margin-bottom: 3px;
        }
        .tag-persona { background: #e8f0fe; color: #1967d2; } /* Darker blue */
        .tag-type { background: #e6f4ea; color: #137333; } /* Darker green */
        .tag-autoimmune { background: #fef7e0; color: #b06000; }
        .tag-professional { background: #f3e8fd; color: #7627bb; }
        .export-btn {
            background: #1967d2; /* Darker blue for better contrast */
            color: white;
            border: none;
            padding: 12px 16px; /* Increased padding for better touch target */
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px; /* Increased from 12px */
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px; /* Increased gap */
            min-height: 44px; /* WCAG minimum touch target size */
            transition: background-color 0.2s ease;
        }
        .export-btn:hover,
        .export-btn:focus {
            background: #174ea6; /* Darker on hover/focus */
            outline: 2px solid #1967d2;
            outline-offset: 2px;
        }
        .export-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dadce0; /* Darker border */
        }
        .export-info {
            font-size: 14px; /* Increased from 12px */
            color: #202124; /* Darker text */
            margin-bottom: 8px;
        }
        
        /* Focus indicators for keyboard navigation */
        button:focus,
        .load-example:focus {
            outline: 2px solid #1967d2;
            outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .card {
                border: 2px solid #000;
            }
            .progress-bar {
                border: 1px solid #000;
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .progress-fill {
                transition: none;
            }
            .export-btn {
                transition: none;
            }
        }
    </style>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header class="header" role="banner">
        <div class="header-left">
            <div class="logo" aria-label="Encephalitis International logo">🧠</div>
            <div>
                <h1>Encephalitis Content Classifier</h1>
                <div class="header-subtitle">AI-Driven Knowledge Agent</div>
            </div>
        </div>
        <div class="header-right" id="model-info" aria-live="polite">Claude Opus 4.5</div>
    </header>

    <main id="main-content" class="container" role="main">
        <div class="grid">
            <!-- Sitemap XML -->
            <section class="card" aria-labelledby="sitemap-heading">
                <h2 id="sitemap-heading">📄 Sitemap XML</h2>
                <button class="load-example" onclick="loadExample()" aria-describedby="sitemap-content">Load Example</button>
                <div class="sitemap-box" id="sitemap-content" role="log" aria-live="polite" aria-label="Sitemap processing status">
                    <div style="color: #999;">Loading sitemap data...</div>
                </div>
                <div class="progress-section">
                    <div class="progress-label">
                        <span>Processing...</span>
                        <span id="progress-percentage" aria-live="polite">0%</span>
                    </div>
                    <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-labelledby="progress-percentage">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">
                        <span id="items-left" aria-live="polite">0</span> items left
                    </div>
                </div>
                <div class="export-section">
                    <div class="export-info">📦 <span id="export-count" aria-live="polite">0</span> records ready</div>
                    <button class="export-btn" onclick="exportData()" aria-describedby="export-count">
                        <span aria-hidden="true">📥</span>
                        <span>Export Data</span>
                    </button>
                </div>
            </section>

            <!-- Content by Stage -->
            <section class="card" aria-labelledby="stages-heading">
                <h2 id="stages-heading">Content by Stage</h2>
                <div class="chart-container">
                    <canvas id="stages-chart" aria-label="Bar chart showing content distribution by patient journey stage"></canvas>
                </div>
            </section>

            <!-- Target Personas -->
            <section class="card" aria-labelledby="personas-heading">
                <h2 id="personas-heading">Target Personas</h2>
                <div class="chart-container">
                    <canvas id="personas-chart" aria-label="Pie chart showing content distribution by target persona"></canvas>
                </div>
            </section>
        </div>

        <div class="grid-row-2">
            <!-- Medical Types -->
            <section class="card" aria-labelledby="types-heading">
                <h2 id="types-heading">Medical Types</h2>
                <div class="chart-container">
                    <canvas id="types-chart" aria-label="Bar chart showing content distribution by medical condition type"></canvas>
                </div>
            </section>

            <!-- Topics Coverage -->
            <section class="card" aria-labelledby="topics-heading">
                <h2 id="topics-heading">Topics Coverage</h2>
                <div class="chart-container">
                    <canvas id="topics-chart" aria-label="Horizontal bar chart showing content distribution by topic"></canvas>
                </div>
            </section>
        </div>

        <!-- Processing Queue -->
        <section class="card queue-section" aria-labelledby="queue-heading">
            <div class="queue-header">
                <h2 id="queue-heading">Processing Queue</h2>
                <span class="queue-count" id="queue-count" aria-live="polite">0 items</span>
            </div>
            <div class="queue-table-wrapper">
                <table class="queue-table" role="table" aria-labelledby="queue-heading">
                    <thead>
                        <tr>
                            <th scope="col" style="width: 50px;">STATUS</th>
                            <th scope="col">URL</th>
                            <th scope="col" style="width: 300px;">CLASSIFICATION</th>
                        </tr>
                    </thead>
                    <tbody id="queue-body">
                        <tr>
                            <td colspan="3" style="text-align: center; color: #999; padding: 40px;">
                                No items in queue
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </main>

    <script>
        let stagesChart, personasChart, typesChart, topicsChart;

        // Colorblind-friendly palettes (Tol schemes)
        // Personas - Tol Bright (6 colors)
        const personaColors = [
            '#4477AA',  // Blue - Patient
            '#66CCEE',  // Cyan - Person Affected
            '#228833',  // Green - Caregiver  
            '#CCBB44',  // Yellow - Parent
            '#EE6677',  // Red - Professional
            '#AA3377'   // Purple - Bereaved
        ];
        
        // Stages - Tol Muted (4 colors for journey stages)
        const stageColors = [
            '#88CCEE',  // Light Blue - Pre-diagnosis
            '#44AA99',  // Teal - Acute Hospital
            '#117733',  // Dark Green - Early Recovery
            '#332288'   // Dark Blue - Long-term Management
        ];
        
        // Types/Topics - Tol Vibrant (extended for more categories)
        const categoryColors = [
            '#EE7733',  // Orange
            '#0077BB',  // Blue
            '#33BBEE',  // Cyan
            '#EE3377',  // Magenta
            '#CC3311',  // Red
            '#009988',  // Teal
            '#BBBBBB',  // Grey
            '#000000'   // Black
        ];

        function updateDashboard() {
            fetch('/api/status')
                .then(res => res.json())
                .then(data => {
                    if (!data.stats) return;

                    const stats = data.stats;

                    // Update model name
                    if (data.model_name) {
                        document.getElementById('model-info').textContent = data.model_name;
                    }

                    // Update progress
                    const progressPct = Math.round(stats.progress.percentage);
                    document.getElementById('progress-fill').style.width = progressPct + '%';
                    document.getElementById('progress-percentage').textContent = progressPct + '%';
                    document.getElementById('items-left').textContent = stats.progress.items_left || 0;
                    document.getElementById('export-count').textContent = stats.successful || 0;

                    // Update sitemap (show recent URLs)
                    updateSitemap(data.queue_items);

                    // Update charts
                    updateStagesChart(stats.tags.stages);
                    updatePersonasChart(stats.tags.personas);
                    updateTypesChart(stats.tags.types);
                    updateTopicsChart(stats.tags.topics);

                    // Update queue
                    updateQueue(data.queue_items);
                })
                .catch(err => console.error('Error fetching status:', err));
        }

        function updateSitemap(queueItems) {
            const container = document.getElementById('sitemap-content');
            if (!queueItems || queueItems.length === 0) {
                container.innerHTML = '<div style="color: #999;">No URLs processed yet</div>';
                return;
            }

            const urls = queueItems.slice(0, 15).map(item => {
                const url = item.url;
                return `<div>&lt;url&gt;<br/>  &lt;loc&gt;<span class="url">${url}</span>&lt;/loc&gt;<br/>&lt;/url&gt;</div>`;
            }).join('<br/>');

            container.innerHTML = urls;
        }

        function updateStagesChart(data) {
            const canvas = document.getElementById('stages-chart');
            const ctx = canvas.getContext('2d');

            const labels = Object.keys(data);
            const values = Object.values(data);

            if (stagesChart) {
                stagesChart.data.labels = labels;
                stagesChart.data.datasets[0].data = values;
                stagesChart.data.datasets[0].backgroundColor = stageColors.slice(0, labels.length);
                stagesChart.update('none'); // Disable animation for updates
            } else {
                stagesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: stageColors.slice(0, labels.length),
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: { enabled: true }
                        },
                        scales: {
                            x: { 
                                beginAtZero: true, 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            },
                            y: { 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            }
                        },
                        animation: {
                            duration: 750
                        }
                    }
                });
            }
        }

        function updatePersonasChart(data) {
            const canvas = document.getElementById('personas-chart');
            const ctx = canvas.getContext('2d');

            const labels = Object.keys(data);
            const values = Object.values(data);

            if (personasChart) {
                personasChart.data.labels = labels;
                personasChart.data.datasets[0].data = values;
                personasChart.update('none');
            } else {
                personasChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: personaColors,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { 
                                    boxWidth: 12, 
                                    padding: 10, 
                                    font: { size: 11 }
                                }
                            },
                            tooltip: { enabled: true }
                        },
                        animation: {
                            duration: 750
                        }
                    }
                });
            }
        }

        function updateTypesChart(data) {
            const canvas = document.getElementById('types-chart');
            const ctx = canvas.getContext('2d');

            const labels = Object.keys(data);
            const values = Object.values(data);

            if (typesChart) {
                typesChart.data.labels = labels;
                typesChart.data.datasets[0].data = values;
                typesChart.data.datasets[0].backgroundColor = categoryColors.slice(0, labels.length);
                typesChart.update('none');
            } else {
                typesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: categoryColors.slice(0, labels.length),
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: { enabled: true }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            },
                            x: { 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            }
                        },
                        animation: {
                            duration: 750
                        }
                    }
                });
            }
        }

        function updateTopicsChart(data) {
            const canvas = document.getElementById('topics-chart');
            const ctx = canvas.getContext('2d');

            const labels = Object.keys(data);
            const values = Object.values(data);

            if (topicsChart) {
                topicsChart.data.labels = labels;
                topicsChart.data.datasets[0].data = values;
                topicsChart.data.datasets[0].backgroundColor = categoryColors.slice(0, labels.length);
                topicsChart.update('none');
            } else {
                topicsChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: categoryColors.slice(0, labels.length),
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: { enabled: true }
                        },
                        scales: {
                            x: { 
                                beginAtZero: true, 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            },
                            y: { 
                                grid: { display: false },
                                ticks: { font: { size: 11 } }
                            }
                        },
                        animation: {
                            duration: 750
                        }
                    }
                });
            }
        }

        function updateQueue(queueItems) {
            const tbody = document.getElementById('queue-body');
            const count = document.getElementById('queue-count');

            if (!queueItems || queueItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999; padding: 40px;">No items in queue</td></tr>';
                count.textContent = '0 items';
                return;
            }

            count.textContent = `${queueItems.length} items`;

            tbody.innerHTML = queueItems.map(item => {
                const statusIcon = item.status === 'completed' 
                    ? '<span class="status-icon status-completed">✓</span>'
                    : '<span class="status-icon status-error">✗</span>';

                const tags = item.classification.map(tag => {
                    const className = tag.type === 'persona' ? 'tag-persona' : 'tag-type';
                    return `<span class="tag ${className}">${tag.label}</span>`;
                }).join('');

                return `
                    <tr>
                        <td>${statusIcon}</td>
                        <td class="url-cell">${item.url}</td>
                        <td>${tags || '<span style="color: #999;">—</span>'}</td>
                    </tr>
                `;
            }).join('');
        }

        function exportData() {
            window.location.href = '/api/export';
        }

        // Update every 2 seconds
        updateDashboard();
        setInterval(updateDashboard, 2000);
    </script>
</body>
</html>
"""

@app.route('/')
def dashboard():
    """Serve the enhanced monitoring dashboard"""
    return render_template_string(DASHBOARD_HTML)

if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("ENHANCED RESOURCE CLASSIFICATION MONITORING SERVER")
    print("=" * 80)
    print()
    print("✅ Starting enhanced monitoring server...")
    print("   Dashboard: http://localhost:5001")
    print("   API: http://localhost:5001/api/status")
    print("   Export: http://localhost:5001/api/export")
    print()
    print("💡 FEATURES:")
    print("   • Sitemap XML display")
    print("   • Content by Stage (horizontal bar chart)")
    print("   • Target Personas (pie chart)")
    print("   • Medical Types (bar chart)")
    print("   • Topics Coverage (horizontal bar chart)")
    print("   • Processing Queue with live status")
    print("   • Export data functionality")
    print()
    print("📊 USAGE:")
    print("   1. Keep this server running")
    print("   2. In another terminal, run: ./run_resilient.sh process_live_resources.py")
    print("   3. Open http://localhost:5001 in your browser")
    print()
    print("=" * 80)
    print()
    
    # Start monitoring thread
    monitor_thread = threading.Thread(target=monitor_checkpoint, daemon=True)
    monitor_thread.start()
    
    # Start Flask server on port 5001
    app.run(host='0.0.0.0', port=5001, debug=False)
