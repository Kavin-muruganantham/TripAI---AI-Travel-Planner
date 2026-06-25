import React from 'react';

export default function TravelRiskAdvisor({ advisory }) {
  if (!advisory) return null;

  const { riskLevel, keyAlerts = [], packingChecklist = [], healthPrecautions = [], budgetWarnings = [], transportWarnings = [], recommendations = [] } = advisory;

  const badgeColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  }[riskLevel] || 'bg-gray-100 text-gray-800';

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Risk & Advisory</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>{riskLevel?.toUpperCase()}</span>
      </div>

      {keyAlerts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Key Alerts</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {keyAlerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {packingChecklist.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Packing Checklist</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {packingChecklist.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {healthPrecautions.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Health Precautions</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {healthPrecautions.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {budgetWarnings.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Budget Warnings</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {budgetWarnings.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      {transportWarnings.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Transport Warnings</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {transportWarnings.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Recommendations</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
