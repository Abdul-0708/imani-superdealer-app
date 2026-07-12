'use strict';
/* Lightweight in-process metrics exposed in Prometheus text format at /api/metrics.
 * No external dependency. Counters reset on restart (scrape-and-store is the collector's job). */
var startedAt = Date.now();
var reqTotal = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
var BOUNDS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
var buckets = {}; BOUNDS.forEach(function (b) { buckets[b] = 0; });
var durSum = 0, durCount = 0;

function record(status, durationMs) {
  var cls = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';
  reqTotal[cls]++;
  var s = durationMs / 1000;
  durSum += s; durCount++;
  for (var i = 0; i < BOUNDS.length; i++) { if (s <= BOUNDS[i]) buckets[BOUNDS[i]]++; }
}

function prometheus() {
  var mem = process.memoryUsage();
  var up = (Date.now() - startedAt) / 1000;
  var L = [];
  L.push('# HELP imani_up 1 when the service is up');
  L.push('# TYPE imani_up gauge');
  L.push('imani_up 1');
  L.push('# HELP imani_uptime_seconds Process uptime in seconds');
  L.push('# TYPE imani_uptime_seconds gauge');
  L.push('imani_uptime_seconds ' + up.toFixed(0));
  L.push('# HELP imani_http_requests_total Total HTTP responses by status class');
  L.push('# TYPE imani_http_requests_total counter');
  ['2xx', '3xx', '4xx', '5xx'].forEach(function (c) { L.push('imani_http_requests_total{class="' + c + '"} ' + reqTotal[c]); });
  L.push('# HELP imani_http_request_duration_seconds Request latency histogram');
  L.push('# TYPE imani_http_request_duration_seconds histogram');
  BOUNDS.forEach(function (b) { L.push('imani_http_request_duration_seconds_bucket{le="' + b + '"} ' + buckets[b]); });
  L.push('imani_http_request_duration_seconds_bucket{le="+Inf"} ' + durCount);
  L.push('imani_http_request_duration_seconds_sum ' + durSum.toFixed(3));
  L.push('imani_http_request_duration_seconds_count ' + durCount);
  L.push('# HELP imani_process_resident_memory_bytes Resident memory');
  L.push('# TYPE imani_process_resident_memory_bytes gauge');
  L.push('imani_process_resident_memory_bytes ' + mem.rss);
  L.push('# HELP imani_process_heap_used_bytes Heap used');
  L.push('# TYPE imani_process_heap_used_bytes gauge');
  L.push('imani_process_heap_used_bytes ' + mem.heapUsed);
  return L.join('\n') + '\n';
}

module.exports = { record: record, prometheus: prometheus, startedAt: startedAt };
