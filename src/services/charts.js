// ECharts 按需引入 + 绿色主题封装
// 对外暴露: renderRadarChart / renderLineChart / renderBarChart / renderDonutChart
// 所有图表自动适配深色背景 + 绿色配色

import * as echarts from 'echarts/core';
import { RadarChart, LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  RadarChart, LineChart, BarChart, PieChart,
  TooltipComponent, GridComponent, LegendComponent, TitleComponent,
  LabelLayout,
  CanvasRenderer
]);

// ============================================================
// 绿色主题配色
// ============================================================
const PRACTICE_COLORS = {
  accent: '#16A34A',      // 主绿
  accent2: '#2DD288',     // 亮绿
  text: '#F5F5F7',
  muted: '#8B8B96',
  line: '#2A2A3A',
  card: '#14141F',
  warning: '#FFB800',
  error: '#EF5350',
};

const COLOR_PALETTE = [
  PRACTICE_COLORS.accent,
  PRACTICE_COLORS.accent2,
  PRACTICE_COLORS.warning,
  PRACTICE_COLORS.error,
  '#7C3AED',
  '#3B82F6',
];

const BASE_OPTION = {
  textStyle: {
    color: PRACTICE_COLORS.text,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif',
  },
  color: COLOR_PALETTE,
  tooltip: {
    backgroundColor: PRACTICE_COLORS.card,
    borderColor: PRACTICE_COLORS.line,
    textStyle: { color: PRACTICE_COLORS.text },
  },
};

// ============================================================
// 图表实例管理（防止重复初始化）
// ============================================================
const instances = new Map();

function getOrCreate(container) {
  let chart = instances.get(container);
  if (chart && !chart.isDisposed()) return chart;
  chart = echarts.init(container, null, { renderer: 'canvas' });
  instances.set(container, chart);
  return chart;
}

function applyOption(container, option) {
  const chart = getOrCreate(container);
  chart.setOption({ ...BASE_OPTION, ...option }, { notMerge: true });
  return chart;
}

// ============================================================
// 对外 API
// ============================================================

/**
 * 雷达图（掌握度分析）
 * @param {HTMLElement} container
 * @param {Array<{name: string, max: number}>} indicators - 维度
 * @param {Array<{name: string, value: Array<number>}>} series - 数据
 */
export function renderRadarChart(container, indicators, series) {
  return applyOption(container, {
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: PRACTICE_COLORS.muted,
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: PRACTICE_COLORS.line } },
      splitArea: { areaStyle: { color: ['transparent', 'rgba(22,163,74,0.03)'] } },
      axisLine: { lineStyle: { color: PRACTICE_COLORS.line } },
    },
    series: [{
      type: 'radar',
      data: series.map(s => ({
        value: s.value,
        name: s.name,
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
        itemStyle: { color: s.color || PRACTICE_COLORS.accent },
      })),
      emphasis: { areaStyle: { opacity: 0.35 } },
    }],
    legend: series.length > 1 ? {
      bottom: 0,
      textStyle: { color: PRACTICE_COLORS.muted, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    } : undefined,
  });
}

/**
 * 折线图（正确率趋势）
 * @param {HTMLElement} container
 * @param {Array<string>} xData - X 轴标签
 * @param {Array<{name: string, data: Array<number>}>} series
 */
export function renderLineChart(container, xData, series) {
  return applyOption(container, {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: PRACTICE_COLORS.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: PRACTICE_COLORS.line } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: PRACTICE_COLORS.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: PRACTICE_COLORS.line } },
    },
    series: series.map(s => ({
      type: 'line',
      data: s.data,
      name: s.name,
      smooth: true,
      lineStyle: { width: 2 },
      itemStyle: { color: s.color || PRACTICE_COLORS.accent },
      areaStyle: { opacity: 0.1 },
    })),
    legend: series.length > 1 ? {
      top: 0,
      textStyle: { color: PRACTICE_COLORS.muted, fontSize: 11 },
    } : undefined,
  });
}

/**
 * 环形图（题型占比）
 * @param {HTMLElement} container
 * @param {Array<{name: string, value: number}>} data
 */
export function renderDonutChart(container, data) {
  return applyOption(container, {
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      data: data,
      label: {
        color: PRACTICE_COLORS.muted,
        fontSize: 11,
      },
      itemStyle: {
        borderColor: PRACTICE_COLORS.card,
        borderWidth: 2,
      },
    }],
  });
}

/**
 * 柱状图
 * @param {HTMLElement} container
 * @param {Array<string>} xData
 * @param {Array<{name: string, data: Array<number>}>} series
 */
export function renderBarChart(container, xData, series) {
  return applyOption(container, {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: PRACTICE_COLORS.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: PRACTICE_COLORS.line } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: PRACTICE_COLORS.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: PRACTICE_COLORS.line } },
    },
    series: series.map(s => ({
      type: 'bar',
      data: s.data,
      name: s.name,
      itemStyle: { color: s.color || PRACTICE_COLORS.accent, borderRadius: [4, 4, 0, 0] },
    })),
  });
}

/**
 * 销毁图表实例（页面卸载时调用）
 */
export function disposeChart(container) {
  const chart = instances.get(container);
  if (chart && !chart.isDisposed()) {
    chart.dispose();
  }
  instances.delete(container);
}

/**
 * 响应式 resize（窗口大小变化时调用）
 */
export function resizeAllCharts() {
  instances.forEach(chart => {
    if (!chart.isDisposed()) chart.resize();
  });
}

// 窗口 resize 自动调整
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => resizeAllCharts());
}

export { echarts };
