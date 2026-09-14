/** Soft FR error codes for SSO callback / wizard — never blank. */
export const SSO_FR_ERRORS: Record<string, string> = {
  invalid_state: 'Session SSO expirée ou invalide. Réessayez depuis la page de connexion.',
  idp_not_found: 'Fournisseur d’identité introuvable ou révoqué.',
  idp_not_connected: 'L’IdP n’est pas encore connecté. Demandez à un Owner de finaliser la configuration.',
  oidc_exchange: 'Échec de l’échange OIDC avec votre IdP. Vérifiez la configuration puis réessayez.',
  oidc_claims: 'Votre IdP n’a pas renvoyé d’e-mail utilisable. Contactez votre administrateur.',
  saml_validate: 'Assertion SAML invalide ou expirée. Réessayez la connexion.',
  saml_claims: 'Assertion SAML sans adresse e-mail. Contactez votre administrateur.',
  domain_denied: 'Votre domaine e-mail n’est pas autorisé pour cette organisation.',
  access_denied: 'Connexion refusée par votre IdP.',
  test_failed: 'Échec du test de connexion. Métadonnées inaccessibles ou secret invalide.',
  config_incomplete: 'Configuration IdP incomplète pour le mode actif.',
  generic: 'La connexion SSO a échoué. Réessayez ou utilisez un lien magique.',
};

export function ssoFrError(code: string | undefined | null): string {
  if (!code) return SSO_FR_ERRORS.generic;
  return SSO_FR_ERRORS[code] ?? SSO_FR_ERRORS.generic;
}
