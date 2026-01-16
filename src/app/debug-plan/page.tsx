import { debugUserPlan } from "@/actions/debug-user-plan";

import { ManualActivateButtons } from "./components/manual-activate-buttons";

export default async function DebugPlanPage() {
  const data = await debugUserPlan();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug - Status do Plano</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Ativação Manual (Para Teste)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Use estes botões para ativar manualmente um plano para teste:
          </p>
          <ManualActivateButtons />
        </div>
        
        <div className="mt-6">
          <a href="/planos" className="text-blue-600 hover:underline">
            ← Voltar para Planos
          </a>
        </div>
      </div>
    </div>
  );
}
