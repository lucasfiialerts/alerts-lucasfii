/**
 * Funções para gerenciar preferências de alertas do usuário
 */

export interface AlertPreferences {
  alertPreferencesReports: boolean;
  alertPreferencesMarketClose: boolean;
  alertPreferencesTreasury: boolean;
  alertPreferencesAutoUpdate: boolean;
  alertPreferencesVariation: boolean;
  alertPreferencesYield: boolean;
  alertPreferencesFnet: boolean;
  alertPreferencesBitcoin: boolean;
  alertPreferencesStatusInvest: boolean;
  alertPreferencesOnDemandQuote: boolean;
}

/**
 * Buscar preferências de alertas do usuário
 */
export async function getUserAlertPreferences(): Promise<AlertPreferences> {
  const response = await fetch('/api/user/alert-preferences', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar preferências');
  }

  const data = await response.json();
  return data.preferences;
}

/**
 * Atualizar preferências de alertas do usuário
 */
export async function updateUserAlertPreferences(
  preferences: Partial<AlertPreferences>
): Promise<AlertPreferences> {
  const response = await fetch('/api/user/alert-preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar preferências');
  }

  const data = await response.json();
  return data.preferences;
}

/**
 * Atualizar uma preferência específica
 */
export async function updateSingleAlertPreference(
  key: keyof AlertPreferences,
  value: boolean
): Promise<AlertPreferences> {
  return updateUserAlertPreferences({ [key]: value });
}
