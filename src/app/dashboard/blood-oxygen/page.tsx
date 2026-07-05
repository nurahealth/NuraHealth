import MetricPager from "@/components/dashboard/MetricPager";

// Thin route wrapper: the detail view lives in ./view.tsx and is rendered as one
// panel inside the swipeable MetricPager, opened scrolled to this metric.
export default function Page() {
  return <MetricPager initialMetric="blood-oxygen" />;
}
