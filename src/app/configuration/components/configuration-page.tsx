"use client";

import { Bell, Check, DollarSign, FileText, LogOut, Mail, Phone, Settings, Shield, TrendingUp, X, CreditCard, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";

import { deleteAccount } from "@/actions/delete-account";
import { createBillingPortalSession } from "@/actions/create-billing-portal-session";
import { getUserWhatsAppData } from "@/actions/get-user-whatsapp-data";
import { getUserSubscription } from "@/actions/get-user-subscription";
import { syncSubscriptionStatus } from "@/actions/sync-subscription-status";
import { saveWhatsAppNumber } from "@/actions/save-whatsapp-number";
import { verifyWhatsAppCode } from "@/actions/verify-whatsapp-code";
import { activateBetaTester } from "@/actions/activate-beta-tester";
import { deactivateBetaTester } from "@/actions/deactivate-beta-tester";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp-status";
import { authClient } from "@/lib/auth-client";
import { sendWhatsAppVerification } from "@/lib/whatsapp-api";
import { getUserAlertPreferences, updateSingleAlertPreference, type AlertPreferences } from "@/lib/alert-preferences";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import Notification, { NotificationType } from "@/components/ui/notification-toast";
import { useDevMode } from "@/contexts/dev-mode-context";

interface ConfigurationPageProps {
  session: {
    user?: {
      name?: string;
      email?: string;
      image?: string | null;
    };
  };
}

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
}

export function ConfigurationPage({ session }: ConfigurationPageProps) {
  const router = useRouter();
  const { refreshStatus } = useWhatsAppStatus();
  const { isDevMode, setIsDevMode } = useDevMode();

  // Sistema de notificações
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const nextIdRef = useRef(1);

  const addNotification = (type: NotificationType, title: string, message?: string, showIcon?: boolean, duration?: number) => {
    const newNotification: NotificationItem = {
      id: nextIdRef.current++,
      type,
      title,
      message,
      showIcon: showIcon ?? true,
      duration: duration ?? 4000,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const handleCloseNotification = (id: number) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  // Estado do Beta Mode
  const [isBetaModeActive, setIsBetaModeActive] = useState(false);
  const [isTogglingBeta, setIsTogglingBeta] = useState(false);

  // Estados do WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [inputWhatsappNumber, setInputWhatsappNumber] = useState("");
  const [inputVerificationCode, setInputVerificationCode] = useState("");

  // Outros estados
  const [email, setEmail] = useState(session?.user?.email || "");
  const [variationThreshold, setVariationThreshold] = useState("1");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Estados dos switches - baseado nas preferências do usuário
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>({
    alertPreferencesReports: true,
    alertPreferencesMarketClose: false,
    alertPreferencesTreasury: false,
    alertPreferencesAutoUpdate: false,
    alertPreferencesVariation: true,
    alertPreferencesYield: false,
    alertPreferencesFnet: false,
    alertPreferencesBitcoin: false,
    alertPreferencesStatusInvest: false,
    alertPreferencesOnDemandQuote: false,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Estados de compatibilidade (mapeados das preferências)
  const fechamentoMercado = alertPreferences.alertPreferencesMarketClose;
  const tesouroDireto = alertPreferences.alertPreferencesTreasury;
  const atualizacaoAutomatica = alertPreferences.alertPreferencesAutoUpdate;
  const variacao = alertPreferences.alertPreferencesVariation;
  const anunciosRendimentos = alertPreferences.alertPreferencesYield;
  const relatoriosEventos = alertPreferences.alertPreferencesReports;
  const fnetDocumentos = alertPreferences.alertPreferencesFnet;
  const bitcoin = alertPreferences.alertPreferencesBitcoin;
  const statusInvestComunicados = alertPreferences.alertPreferencesStatusInvest;
  const cotacaoSobDemanda = alertPreferences.alertPreferencesOnDemandQuote;

  // Estados do plano do usuário
  const [userPlan, setUserPlan] = useState<{
    plan?: string;
    isActive?: boolean;
    expiresAt?: Date | null;
  } | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  // Função para converter o nome técnico do plano para nome amigável
  const getPlanDisplayName = (planType: string) => {
    const planNames: Record<string, string> = {
      'iniciante': 'Iniciante',
      'investidor': 'Investidor',
      'iniciante_anual': 'Iniciante (Anual)',
      'investidor_anual': 'Investidor (Anual)',
      'beta_tester': 'Beta Tester',
    };
    return planNames[planType] || planType;
  };

  // Carregar dados do WhatsApp ao montar o componente
  useEffect(() => {
    const loadWhatsAppData = async () => {
      try {
        const data = await getUserWhatsAppData();
        setWhatsappNumber(data.whatsappNumber || "");
        setWhatsappVerified(data.whatsappVerified || false);
      } catch (error) {
        console.error("Erro ao carregar dados do WhatsApp:", error);
      }
    };

    loadWhatsAppData();
  }, []);

  // Carregar dados do plano do usuário
  useEffect(() => {
    const loadUserPlan = async () => {
      setIsLoadingPlan(true);
      try {
        await syncSubscriptionStatus();
        const subscription = await getUserSubscription();
        setUserPlan(subscription);
        // Verificar se é Beta Tester e sincronizar
        if (subscription?.plan === 'beta_tester' && subscription?.isActive) {
          setIsBetaModeActive(true);
          setIsDevMode(true);
        } else {
          setIsBetaModeActive(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do plano:", error);
        setUserPlan(null);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadUserPlan();
  }, []);

  // Carregar preferências de alertas
  useEffect(() => {
    const loadAlertPreferences = async () => {
      setIsLoadingPreferences(true);
      try {
        const preferences = await getUserAlertPreferences();
        setAlertPreferences(preferences);
      } catch (error) {
        console.error("Erro ao carregar preferências de alertas:", error);
        // Manter valores padrão se houver erro
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadAlertPreferences();
  }, []);

  // Verificar se o usuário tem plano ativo
  const hasActivePlan = userPlan?.isActive === true;

  // Desativar todos os alertas no banco quando o plano não estiver ativo
  useEffect(() => {
    const disableAlertsIfNoActivePlan = async () => {
      // Aguardar carregamento do plano e preferências
      if (isLoadingPlan || isLoadingPreferences) return;

      // Se não tem plano ativo, verificar se algum alerta está ativo
      if (!hasActivePlan) {
        const hasAnyAlertActive = Object.values(alertPreferences).some(value => value === true);

        if (hasAnyAlertActive) {
          console.log("🚫 Plano inativo detectado. Desativando todos os alertas no banco...");

          try {
            // Desativar todos os alertas no banco
            const allAlertsDisabled: AlertPreferences = {
              alertPreferencesReports: false,
              alertPreferencesMarketClose: false,
              alertPreferencesTreasury: false,
              alertPreferencesAutoUpdate: false,
              alertPreferencesVariation: false,
              alertPreferencesYield: false,
              alertPreferencesFnet: false,
              alertPreferencesBitcoin: false,
              alertPreferencesStatusInvest: false,
              alertPreferencesOnDemandQuote: false,
            };

            await fetch('/api/user/alert-preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(allAlertsDisabled),
            });

            // Atualizar estado local
            setAlertPreferences(allAlertsDisabled);
            console.log("✅ Todos os alertas foram desativados no banco de dados");
          } catch (error) {
            console.error("❌ Erro ao desativar alertas:", error);
          }
        }
      }
    };

    disableAlertsIfNoActivePlan();
  }, [hasActivePlan, isLoadingPlan, isLoadingPreferences, alertPreferences]);

  // Funções para atualizar preferências individuais
  const updatePreference = async (key: keyof AlertPreferences, value: boolean) => {
    // Verificar se o usuário tem plano ativo
    if (!hasActivePlan) {
      addNotification('warning', 'Plano necessário', 'Você precisa de um plano ativo para ativar alertas. Acesse a página de planos para assinar.', true, 6000);
      return;
    }

    try {
      const updatedPreferences = await updateSingleAlertPreference(key, value);
      setAlertPreferences(updatedPreferences);
      console.log(`✅ ${key} atualizado para: ${value}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${key}:`, error);
      // Reverter o estado em caso de erro
      setAlertPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  const setFechamentoMercado = (value: boolean) => updatePreference('alertPreferencesMarketClose', value);
  const setTesouroDireto = (value: boolean) => updatePreference('alertPreferencesTreasury', value);
  const setAtualizacaoAutomatica = (value: boolean) => updatePreference('alertPreferencesAutoUpdate', value);
  const setVariacao = (value: boolean) => updatePreference('alertPreferencesVariation', value);
  const setAnunciosRendimentos = (value: boolean) => updatePreference('alertPreferencesYield', value);
  const setRelatoriosEventos = (value: boolean) => updatePreference('alertPreferencesReports', value);
  const setFnetDocumentos = (value: boolean) => updatePreference('alertPreferencesFnet', value);
  const setBitcoin = (value: boolean) => updatePreference('alertPreferencesBitcoin', value);
  const setStatusInvestComunicados = (value: boolean) => updatePreference('alertPreferencesStatusInvest', value);
  const setCotacaoSobDemanda = (value: boolean) => updatePreference('alertPreferencesOnDemandQuote', value);

  // Função para alternar Beta Mode
  const handleBetaModeToggle = async (checked: boolean) => {
    setIsTogglingBeta(true);
    try {
      if (checked) {
        // Ativar Beta Tester
        const result = await activateBetaTester();
        if (result.success) {
          setIsDevMode(true);
          setIsBetaModeActive(true);
          addNotification('success', 'Beta Mode Ativado', 'Ambiente de testes ativado com sucesso!', true, 2000);
          // Recarregar a página após 2 segundos
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          addNotification('error', 'Erro ao ativar', result.message, true, 5000);
          setIsTogglingBeta(false);
        }
      } else {
        // Desativar Beta Tester
        const result = await deactivateBetaTester();
        if (result.success) {
          setIsDevMode(false);
          setIsBetaModeActive(false);
          addNotification('info', 'Beta Mode Desativado', 'Ambiente de testes desativado.', true, 2000);
          // Recarregar a página após 2 segundos
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          addNotification('error', 'Erro ao desativar', result.message, true, 5000);
          setIsTogglingBeta(false);
        }
      }
    } catch (error) {
      console.error("Erro ao alternar Beta Mode:", error);
      addNotification('error', 'Erro', 'Erro ao alternar Beta Mode. Tente novamente.', true, 5000);
      setIsTogglingBeta(false);
    }
  };

  // Função para conectar WhatsApp
  const handleConnectWhatsApp = async () => {
    if (!inputWhatsappNumber.trim()) {
      addNotification('error', 'Número inválido', 'Por favor, insira um número de WhatsApp válido', true, 4000);
      return;
    }

    setIsConnectingWhatsapp(true);
    try {
      // Salvar número e obter código de verificação
      const result = await saveWhatsAppNumber(inputWhatsappNumber);

      // Enviar mensagem de verificação
      await sendWhatsAppVerification(result.phoneNumber, result.verificationCode);

      // Atualizar estados
      setWhatsappNumber(result.phoneNumber);
      setVerificationCode(result.verificationCode);
      setShowWhatsappModal(false);
      setShowVerificationModal(true);

      addNotification('success', 'Código enviado!', 'Código de verificação enviado para seu WhatsApp!');
    } catch (error) {
      console.error("Erro ao conectar WhatsApp:", error);
      addNotification('error', 'Erro ao conectar', 'Erro ao conectar WhatsApp. Tente novamente.', true, 5000);
    } finally {
      setIsConnectingWhatsapp(false);
    }
  };

  // Função para verificar código
  const handleVerifyCode = async () => {
    if (!inputVerificationCode.trim()) {
      addNotification('error', 'Código necessário', 'Por favor, insira o código de verificação', true, 4000);
      return;
    }

    setIsVerifying(true);
    try {
      await verifyWhatsAppCode(inputVerificationCode);
      setWhatsappVerified(true);
      setShowVerificationModal(false);
      setInputVerificationCode("");

      // Atualizar o status global do WhatsApp
      await refreshStatus();

      addNotification('success', 'WhatsApp verificado!', 'WhatsApp verificado com sucesso!');
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      addNotification('error', 'Código inválido', 'Código inválido. Tente novamente.', true, 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  // Função de logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      addNotification('error', 'Erro ao fazer logout', 'Não foi possível fazer logout. Tente novamente.', true, 5000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Função para excluir conta
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // Excluir a conta do banco de dados
      await deleteAccount();

      // Fazer logout do cliente
      await authClient.signOut();

      // Redirecionar para a página inicial
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      addNotification('error', 'Erro ao excluir conta', 'Não foi possível excluir a conta. Tente novamente.', true, 5000);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoadingPreferences || isLoadingPlan) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl">Configuração</h1>
          <br />
        </div>

        {/* Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* WhatsApp Number */}
          <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-300 text-sm sm:text-base font-bold flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Número do WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-white font-semibold text-lg">
                  {whatsappNumber ? `+${whatsappNumber}` : "Não conectado"}
                </div>
                {whatsappVerified && (
                  <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Verificado
                  </div>
                )}
                {whatsappNumber && !whatsappVerified && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                    <X className="w-4 h-4" />
                    Não verificado
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowWhatsappModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg hover:shadow-green-500/30 transition-all"
                size="sm"
              >
                {whatsappNumber ? "Alterar número" : "Conectar WhatsApp"}
              </Button>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-300 text-sm sm:text-base font-bold flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                E-mail vinculado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white font-semibold text-lg break-all">{email}</div>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <CardTitle className={`text-sm sm:text-base font-bold ${userPlan?.isActive ? "text-green-400" : "text-gray-400"
                }`}>
                {isLoadingPlan
                  ? "Carregando..."
                  : (userPlan?.plan ? getPlanDisplayName(userPlan.plan) : "Nenhum plano ativo")
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingPlan ? (
                <>
                  <div className="h-5 bg-gray-700 animate-pulse rounded w-20"></div>
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-28"></div>
                  <div className="h-4 bg-gray-700 animate-pulse rounded w-36"></div>
                </>
              ) : userPlan?.isActive ? (
                <>
                  <div className="text-white font-semibold text-lg">
                    <span className="text-green-400">Ativo</span>
                  </div>
                  {/* TODO: Implementar melhorias na update de data
                  
                  {userPlan.expiresAt && (
                    <div className="text-gray-400 text-sm">
                      Vencimento: {userPlan.expiresAt instanceof Date
                        ? userPlan.expiresAt.toLocaleDateString('pt-BR')
                        : new Date(userPlan.expiresAt).toLocaleDateString('pt-BR')
                      }
                    </div>
                  )} */}
                </>
              ) : (
                <>
                  <div className="text-white font-semibold text-lg">
                    <span className="text-orange-400">Inativo</span>
                  </div>
                  <div className="text-gray-300 text-sm font-medium">Você não possui um plano ativo</div>
                </>
              )}
              <button
                onClick={() => {
                  if (userPlan?.isActive) {
                    createBillingPortalSession();
                  } else {
                    router.push("/planos");
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-left transition-all duration-300 cursor-pointer text-green-300 hover:bg-green-600/30 hover:text-green-200 hover:shadow-lg hover:shadow-green-500/20 mt-3 font-bold"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">
                  {userPlan?.isActive ? "Gerenciar assinatura" : "Ver planos"}
                </span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* TODO: Temporarily hidden === Alert Variation === */}

        {/* <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl opacity-50">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 opacity-50" />
              <span className="flex items-center gap-2">
                Variação para disparo de alerta
                <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">EM BREVE</span>
              </span>
            </CardTitle>
            <p className="text-gray-300 text-sm font-medium mt-2">
              Ativos da sua lista que ultrapassarem esse valor (positivo ou negativo) disparam um alerta.
            </p>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={variationThreshold}
                onChange={(e) => setVariationThreshold(e.target.value)}
                className="w-20 bg-gray-800 border-gray-600 text-white opacity-50"
                disabled
              />
              <span className="text-gray-400 opacity-50">%</span>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 opacity-50"
              size="sm"
              disabled
            >
              Salvar
            </Button>
          </CardContent>
        </Card> */}

        {/* Alert Preferences */}
        <div className="space-y-4 sm:space-y-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 break-words">
              Preferências de alertas
            </h3>
          </div>

          {/* Skeleton de carregamento enquanto verifica o plano */}
          {(isLoadingPlan || isLoadingPreferences) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-700 animate-pulse rounded-lg mr-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-700 animate-pulse rounded w-32"></div>
                          <div className="h-3 bg-gray-700 animate-pulse rounded w-12"></div>
                        </div>
                      </div>
                      <div className="w-11 h-6 bg-gray-700 animate-pulse rounded-full"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 animate-pulse rounded w-full"></div>
                      <div className="h-3 bg-gray-700 animate-pulse rounded w-5/6"></div>
                      <div className="h-3 bg-gray-700 animate-pulse rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* 1. Variação de Preço */}

              <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Variação de Preço</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                      </div>
                    </div>
                    <Switch
                      checked={variacao && hasActivePlan}
                      onCheckedChange={setVariacao}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Com este alerta ativado, você é avisado no WhatsApp sempre que a variação ultrapassar o limite.
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. TODO: Temporarily hidden === Atualização Automática === */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Lista de Acompanhamento</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                      </div>
                    </div>
                    <Switch
                      checked={atualizacaoAutomatica && hasActivePlan}
                      onCheckedChange={setAtualizacaoAutomatica}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    A cada hora nosso sistema verifica e envia automaticamente as
                    variações recentes dos ativos que você acompanha.
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* 3. TODO: Temporarily hidden === Relatórios e Eventos === */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Relatórios e Eventos</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                      </div>
                    </div>
                    <Switch
                      checked={relatoriosEventos && hasActivePlan}
                      onCheckedChange={setRelatoriosEventos}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Você receberá o documento sempre que um ativo da sua lista
                    divulgar relatórios gerenciais, fatos relevantes, atualizações patrimoniais. sem uso de IA!
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* TODO: Card Status Invest - Comunicados (Relatórios, Fatos Relevantes, Informes) */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-green-500/40 hover:bg-green-600/20 transition-all duration-300 hover:shadow-green-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Comunicados de FIIs</CardTitle>
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">NOVO</span>
                      </div>
                    </div>
                    <Switch
                      checked={statusInvestComunicados && hasActivePlan}
                      onCheckedChange={setStatusInvestComunicados}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Receba alertas de <strong>Relatórios Gerenciais</strong>, <strong>Fatos Relevantes</strong> e <strong>Informes Mensais</strong> dos 
                    FIIs que você acompanha. Sem resumo de IA - direto da fonte!
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* 4. Relatórios Gerenciais (FNET) */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-indigo-500/40 hover:bg-indigo-600/20 transition-all duration-300 hover:shadow-indigo-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Relatórios e Eventos</CardTitle>
                      </div>
                    </div>
                    <Switch
                      checked={fnetDocumentos && hasActivePlan}
                      onCheckedChange={setFnetDocumentos}
                      disabled={!hasActivePlan}
                    />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Você receberá o documento sempre que um ativo da sua lista divulgar <strong>relatórios gerenciais</strong>, <strong>fatos relevantes</strong>, atualizações patrimoniais ou qualquer outra informação oficial. Tudo direto no seu WhatsApp, sem precisar buscar.
                    </p>
                    {!hasActivePlan && (
                      <div className="mt-3 text-orange-400 text-xs font-bold">
                        ⚠️ Plano necessário para ativar este alerta!
                      </div>
                    )}
                  </CardContent>
                </Card> */}


              {/* 5. Cotação Sob Demanda */}

              <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-cyan-500/40 hover:bg-cyan-600/20 transition-all duration-300 hover:shadow-cyan-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Cotação Sob Demanda</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                        {/* <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">💬</span> */}
                      </div>
                    </div>
                    <Switch
                      checked={cotacaoSobDemanda && hasActivePlan}
                      onCheckedChange={setCotacaoSobDemanda}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    Consulte cotações a qualquer momento! Envie mensagens como <strong>&quot;HGLG11&quot;</strong> ou <strong>&quot;cotacao VISC11&quot;</strong> no WhatsApp e receba instantaneamente:
                  </p>
                  <ul className="text-gray-300 text-xs space-y-1 mb-3 ml-4">
                    <li>📊 Cotação atual e variação do dia</li>
                    <li>📈 Máxima e mínima</li>
                    <li>💰 Volume negociado</li>
                    <li>⏰ Horário da última atualização</li>
                  </ul>
                  <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-3 mt-3">
                    <p className="text-cyan-300 text-xs">
                      <strong>⏱️ Rate Limit:</strong> Para evitar spam, você pode consultar a mesma cotação a cada 2 minutos.
                    </p>
                  </div>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este recurso!
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* 6. TODO: Temporarily hidden === Anúncios de Rendimentos === */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Anúncios de Rendimentos</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                      </div>
                    </div>
                    <Switch
                      checked={anunciosRendimentos && hasActivePlan}
                      onCheckedChange={setAnunciosRendimentos}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Sempre que um ativo da lista que você acompanha anunciar o
                    pagamento de rendimentos, você será avisado direto no WhatsApp.
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* 8. TODO: Temporarily hidden === Bitcoin === */}

              {/* <Card className={`bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20 hover:scale-[1.02] ${!hasActivePlan ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-3 shadow-lg ${!hasActivePlan ? 'opacity-50' : ''}`}>
                        <DollarSign className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-base sm:text-lg font-bold">Bitcoin</CardTitle>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">BETA</span>
                      </div>
                    </div>
                    <Switch
                      checked={bitcoin && hasActivePlan}
                      onCheckedChange={setBitcoin}
                      disabled={!hasActivePlan}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Receba atualizações sobre as principais variações do Bitcoin
                    diretamente no seu WhatsApp.
                  </p>
                  {!hasActivePlan && (
                    <div className="mt-3 text-orange-400 text-xs font-bold">
                      ⚠️ Plano necessário para ativar este alerta!
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* 6. Fechamento do Mercado */}

              {/* <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl relative opacity-50">
                <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                  EM BREVE
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-600/50 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                        <Bell className="w-6 h-6 text-white/50" />
                      </div>
                      <CardTitle className="text-white/70 text-base sm:text-lg font-bold">Fechamento do Mercado</CardTitle>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                      onCheckedChange={setFechamentoMercado}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    No fim de cada dia útil, você receberá uma mensagem automática com a
                    informação do valor de abertura de preço dos ativos que você acompanha.
                  </p>
                </CardContent>
              </Card> */}

              {/* 7. Tesouro Direto */}

              {/* <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl relative opacity-50">
                <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                  EM BREVE
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-600/50 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                        <DollarSign className="w-6 h-6 text-white/50" />
                      </div>
                      <CardTitle className="text-white/70 text-base sm:text-lg font-bold">Tesouro Direto</CardTitle>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                      onCheckedChange={setTesouroDireto}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    O Tesouro pode alterar as taxas de rendimento de forma dinâmica
                    ao longo do dia. Ativar esta opção, você receberá diretamente no seu WhatsApp.
                  </p>
                </CardContent>
              </Card> */}

            </div>
          )}
        </div>

        {/* Privacy Section */}
        <Card className="bg-slate-900/70 backdrop-blur-xl border-gray-700/50 shadow-xl hover:border-blue-500/40 hover:bg-blue-600/20 transition-all duration-300 hover:shadow-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white text-xl font-black flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Privacidade e segurança
            </CardTitle>

          </CardHeader>
          <CardContent className="space-y-6">
            {/* Beta Mode Section */}
            <div className="border-b border-gray-700/50 pb-6">
              <h3 className="text-gray-300 text-base font-bold flex items-center mb-4">
                <FlaskConical className="w-5 h-5 mr-2" />
                Beta Mode
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* <p className="text-white text-sm font-medium">Ambiente de Testes</p> */}
                  <p className="text-gray-400 text-xs mt-1">
                    Ative para testar novos recursos em desenvolvimento
                  </p>
                </div>
                <Switch
                  checked={isBetaModeActive}
                  onCheckedChange={handleBetaModeToggle}
                  disabled={isTogglingBeta}
                  className="ml-4"
                />
              </div>
            </div>

            {/* User Profile Section */}
            <div className="border-b border-gray-700/50 pb-6">
              <h3 className="text-gray-300 text-base font-bold flex items-center mb-4">
                <Settings className="w-5 h-5 mr-2" />
                Perfil do Usuário
              </h3>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Usuário"}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-400 shadow-lg"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-blue-400 shadow-lg">
                      <span className="text-white text-xl sm:text-2xl font-bold">
                        {(session?.user?.name || session?.user?.email || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-lg sm:text-xl font-bold truncate">
                    {session?.user?.name || session?.user?.email || "Usuário"}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base truncate">
                    {session?.user?.email || "email@example.com"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="bg-transparent border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={() => createBillingPortalSession()}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Gerenciar Assinatura
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-white-600 text-white hover:bg-gray-700 hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={() => setShowDeleteModal(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Encerrar minha conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <br />
      <br />
      <br />

      {/* Modal de conectar WhatsApp */}
      {showWhatsappModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md bg-black/10">
          <div className="bg-[#1a1a34] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center">

            <h2 className="text-xl font-semibold text-white mb-4">Conectar WhatsApp</h2>

            <div className="mb-6">
              <Label htmlFor="whatsapp-input" className="text-white font-semibold">
                Número do WhatsApp (com código do país)
              </Label>
              <Input
                id="whatsapp-input"
                type="tel"
                placeholder="Ex: 5511987654321"
                value={inputWhatsappNumber}
                onChange={(e) => setInputWhatsappNumber(e.target.value)}
                className="mt-2 text-white bg-[#1a1a34] border-gray-300 placeholder:text-white"
              />
              <p className="text-sm text-white mt-1 font-medium opacity-80">
                Digite apenas números (código do país + número)
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWhatsappModal(false);
                  setInputWhatsappNumber("");
                }}
                disabled={isConnectingWhatsapp}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConnectWhatsApp}
                disabled={isConnectingWhatsapp}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isConnectingWhatsapp ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de verificação do WhatsApp */}
      {showVerificationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md bg-black/10">
          <div className="bg-[#1a1a34] rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Verificar WhatsApp</h2>

            <div className="mb-6">
              <p className="text-white mb-3 font-medium">
                Enviamos um código de verificação para o número{' '}
                <span className="font-bold text-white">+{whatsappNumber}</span>.
              </p>
              <Label htmlFor="verification-input" className="text-white font-semibold">
                Código de verificação
              </Label>
              <Input
                id="verification-input"
                type="text"
                placeholder="Digite o código de 6 dígitos"
                value={inputVerificationCode}
                onChange={(e) => setInputVerificationCode(e.target.value)}
                className="mt-2 text-white bg-[#23243a] border-gray-700 placeholder:text-gray-400"
                maxLength={6}
              />
              <p className="text-sm text-gray-300 mt-1 font-medium">
                Verifique sua conversa no WhatsApp
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerificationModal(false);
                  setInputVerificationCode("");
                }}
                disabled={isVerifying}
                className="text-gray-600 border-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isVerifying}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Excluir conta</h2>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Todos os seus dados, ativos monitorados e alertas personalizados serão{' '}
                <span className="text-red-600 font-semibold">permanentemente excluídos</span> da plataforma.
              </p>
              <p className="text-gray-600">
                Se desejar continuar, clique em{' '}
                <span className="text-red-600 font-semibold">Excluir conta</span> abaixo.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-gray-800 text-white hover:bg-gray-900"
              >
                {isDeletingAccount ? 'Excluindo...' : 'Excluir conta'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 p-4 space-y-2 w-full max-w-sm z-50">
        <AnimatePresence>
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              {...notification}
              onClose={() => handleCloseNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
