import { loadScenario } from '@/src/lib/scenarios';
import WeekSimulationClient from '@/src/components/WeekSimulationClient';

export default async function WeekPage({ params }: { params: { weekId: string } }) {
  const scenario = await loadScenario(params.weekId);
  return <WeekSimulationClient scenario={scenario} weekId={params.weekId} />;
}
