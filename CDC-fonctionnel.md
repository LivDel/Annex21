# Cahier des charges fonctionnel — Annex21

**Version** : 1.0  
**Statut** : Brief PO post-blue-ocean (Explorateur) — pivot 100 % numérique  
**Public** : Architecte Technique, UI/UX, Maquettiste, Codeur  

---

## 1. Vision produit

### 1.1 Promesse
SaaS web mid-market de **conformité NIS2 native** (hors finance/DORA en V1) : playbooks d’incident nationaux, Trust Center multi-langue, collecte de preuves cloud/IdP — **data in-EU**.

### 1.2 Problème adressé
- Outils US (Vanta/Drata) = SOC 2-first, NIS2 en add-on, mappings nationaux faibles, data souvent hors UE.
- Mid-market trop gros pour Excel, trop petit pour AuditBoard.
- IT-SA 2025 (DE, n=245) : **53 %** n’ont pas vérifié leur Betroffenheit (applicabilité).

### 1.3 Angle différenciant
NIS2-first + playbooks nationaux (FR ANSSI / DE BSI : 24h–72h–1 mois) + Trust Center acheteurs + residency UE. Pas un clone Vanta multi-framework.

### 1.4 ICP
| Critère | Cible |
|---------|--------|
| Taille | 50–249 salariés (focus commercial 100–400) |
| CA | ≥ 10 M€ |
| Secteurs | Importants NIS2 hors finance (providers numériques, MSP, industrie, scale-ups B2B) |
| Acheteur | CISO / RSSI / DSI ; co-buyer DG |
| Géo | FR puis DACH |

### 1.5 MVP (v1)
- Assessment applicabilité NIS2 (Betroffenheit) + score de maturité.
- Playbooks incidents nationaux FR (ANSSI) + DE (BSI) avec timelines 24h / 72h / 1 mois.
- Trust Center public multi-langue (FR/EN/DE) + questionnaires acheteurs.
- Collecte preuves cloud/IdP (connecteurs MVP limités).
- Dashboard conformité, rôles org, audit trail, **data in-EU**.
- Onboarding guidé + export preuves pour audits.

Hors MVP : terrain/hardware, DORA/finance, TPRM profond, white-label MSP, ISO cross-mapping large.

### 1.6 Vision v2
- TPRM fournisseurs.
- Module DORA.
- Cross-mapping ISO large.
- White-label MSP.
- Plus de connecteurs cloud + automatisations.

### 1.7 Monétisation
- ACV **10–30 k€/an**
- Onboarding **5–15 k€**

---

## 2. Personae / rôles

| Rôle | Description |
|------|-------------|
| Owner (CISO/RSSI) | Pilote conformité, valide incidents, publie Trust Center |
| Contributor (IT/SecOps) | Exécute playbooks, joint preuves |
| Viewer (DG / board) | Lecture score + Trust Center |
| External buyer | Consulte Trust Center public / répond questionnaires |
| Platform admin | Ops Annex21 (tenants, billing, support) |

---

## 3. User Stories détaillées

### 3.1 Conformité & assessment
**US-C01** — En tant que CISO, je veux évaluer si mon org est dans le périmètre NIS2 afin de savoir quoi prioriser.  
**US-C02** — En tant que CISO, je veux un score de maturité par domaine NIS2 afin de piloter le plan d’action.  
**US-C03** — En tant que Contributor, je veux assigner des contrôles / tâches avec échéances afin de réduire les gaps.

### 3.2 Incidents / playbooks
**US-I01** — En tant que CISO, je veux ouvrir un incident et choisir le playbook national (ANSSI/BSI) afin de respecter les délais légaux.  
**US-I02** — En tant que Contributor, je veux suivre une checklist 24h / 72h / 1 mois avec owners et preuves afin de ne rien oublier.  
**US-I03** — En tant que CISO, je veux générer un dossier d’notification (export) afin de communiquer aux autorités / direction.  
**US-I04** — En tant que système, je veux alerter avant échéance SLA playbook afin d’éviter le manquement.

### 3.3 Trust Center
**US-T01** — En tant que CISO, je veux publier un Trust Center (statuts, docs, certifications) afin de rassurer les acheteurs.  
**US-T02** — En tant qu’acheteur externe, je veux consulter le Trust Center sans compte (ou avec accès restreint) afin d’évaluer le fournisseur.  
**US-T03** — En tant que CISO, je veux répondre / préremplir des questionnaires acheteurs afin de gagner du temps commercial.  
**US-T04** — En tant que CISO, je veux gérer FR/EN/DE sur le Trust Center afin d’adresser FR + DACH.

### 3.4 Preuves (evidence)
**US-E01** — En tant que Contributor, je veux connecter cloud/IdP et collecter des preuves afin d’éviter l’upload manuel.  
**US-E02** — En tant que CISO, je veux lier une preuve à un contrôle / incident afin de constituer un dossier audit-ready.  
**US-E03** — En tant que CISO, je veux exporter un pack de preuves afin de le transmettre à un auditeur.

### 3.5 Admin org
**US-A01** — En tant qu’Owner, je veux inviter des users et définir des rôles afin de séparer responsabilités.  
**US-A02** — En tant qu’Owner, je veux voir l’audit trail des actions sensibles afin de prouver la gouvernance.  
**US-A03** — En tant qu’Owner, je veux configurer la résidence / politique de rétention (in-EU) afin de rester conforme.

---

## 4. Règles de gestion & contraintes métier

### 4.1 Périmètre NIS2
- **RG-01** : V1 = NIS2 hors finance/DORA. Aucun claim DORA dans l’UI MVP.
- **RG-02** : Assessment applicabilité = questionnaire structuré + résultat `in_scope` / `out_of_scope` / `unclear` (avec disclaimer : non avis juridique).

### 4.2 Playbooks
- **RG-03** : Playbooks versionnés par pays (FR-ANSSI, DE-BSI) ; org choisit le(s) playbook(s) applicable(s).
- **RG-04** : Timelines canoniques MVP : **24h**, **72h**, **1 mois** (horodatage UTC + timezone org).
- **RG-05** : Une étape playbook ne passe `done` que si owner + preuve minimale (si requise) sont présents.
- **RG-06** : Alertes J-0 / avant échéance ; escalation Owner si Contributor en retard.

### 4.3 Trust Center
- **RG-07** : Contenu Trust Center = publié explicitement (draft ≠ public).
- **RG-08** : Accès public / lien privé / NDA gate (config org) ; pas d’exposition de preuves internes brutes.
- **RG-09** : Questionnaires acheteurs : réponses traçables, réutilisables, multi-langue.

### 4.4 Preuves & data
- **RG-10** : **Data in-EU** obligatoire (stockage, backups, logs applicatifs sensibles).
- **RG-11** : Toute preuve a provenance (manuel / connecteur), hash ou version, date de collecte, lien contrôle.
- **RG-12** : Rétention configurable ; soft-delete + audit avant purge.

### 4.5 Sécurité produit
- **RG-13** : RBAC strict (Owner / Contributor / Viewer / External).
- **RG-14** : SSO (SAML/OIDC) cible MVP ou fin MVP ; MFA obligatoire Owner.
- **RG-15** : Audit trail immuable (append-only) pour actions sensibles (publish Trust, close incident, export).

### 4.6 Commercial
- **RG-16** : Tenant multi-org ; billing ACV annuel + fee onboarding.
- **RG-17** : Feature flags V2 (TPRM, DORA, white-label) masqués en V1.

---

## 5. Arborescence globale (web)

```
/
├── /                          Landing (ICP, NIS2-first, data-in-EU)
├── /pricing
├── /security | /legal | /privacy
├── /trust/:orgSlug            Trust Center public
│
├── /auth (login, SSO, invite)
│
├── /app
│   ├── /                      Dashboard conformité + score
│   ├── /assessment            Betroffenheit / applicabilité
│   ├── /controls              Plan d’action / gaps
│   ├── /incidents             Liste + création
│   ├── /incidents/:id         Playbook 24h/72h/1mois
│   ├── /evidence              Bibliothèque preuves
│   ├── /trust                 Éditeur Trust Center + questionnaires
│   ├── /settings              Users, rôles, SSO, rétention
│   └── /billing               Abonnement / onboarding
│
└── /admin (platform)
    ├── /tenants
    ├── /playbooks (versions ANSSI/BSI)
    └── /support
```

### Entités métier clés
`Organization`, `Membership`, `Role`, `Nis2Assessment`, `Control`, `Task`, `Incident`, `Playbook`, `PlaybookStep`, `Evidence`, `Connector`, `TrustCenter`, `TrustDocument`, `Questionnaire`, `QuestionnaireResponse`, `AuditEvent`, `Subscription`.

---

## 6. Happy path MVP
1. Signup org → assessment applicabilité NIS2.  
2. Dashboard score + gaps.  
3. Connecteur cloud/IdP → premières preuves.  
4. Simulation / vrai incident → playbook national → checklist + alertes.  
5. Publication Trust Center + réponse questionnaire acheteur.  
6. Export pack audit.

---

## 7. Critères d’acceptation transverses (MVP)
- [ ] Assessment produit un statut clair + disclaimer non-juridique.
- [ ] Playbook FR et DE exécutables bout-en-bout avec timelines 24h/72h/1 mois.
- [ ] Trust Center publiable en ≥2 langues (FR+EN min ; DE cible).
- [ ] Aucune donnée tenant hors UE (env de prod).
- [ ] Export preuves lié aux contrôles / incident.
- [ ] RBAC + audit trail sur publish / close / export.

---

## 8. Hand-off
**→ Architecte Technique** : stack, multi-tenant, data residency EU, connecteurs, SSO, audit trail.  
**→ Stratégie UI/UX** : landing B2B + parcours assessment → incidents → Trust Center (web SaaS, pas app native).  
**→ Maquettiste** : Figma landing / Trust Center / playbooks — identité marquée.

*Hypothèses PO à challenger : connecteurs MVP (ex. AWS/Azure/Google + 1 IdP), SSO en MVP vs fin MVP, DE playbook dès V1 ou FR-first puis DE.*
