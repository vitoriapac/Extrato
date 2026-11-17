/**
 * Catálogo inicial de tópicos canônicos para concursos (Ciclo 2.1 — modelo híbrido).
 * Somente-leitura; usado apenas para sugerir equivalências que exigem confirmação manual.
 */

import type { CanonicalTopicEntry } from './topic-canonical-identity.js';

export const CANONICAL_TOPICS_CATALOG: readonly CanonicalTopicEntry[] = Object.freeze([
  {
    canonicalTopicId: 'canon-mat-juros-compostos',
    canonicalName: 'Juros Compostos',
    aliases: ['Regime de Capitalização Composta', 'Capitalização Composta', 'Equivalência de Taxas'],
  },
  {
    canonicalTopicId: 'canon-mat-juros-simples',
    canonicalName: 'Juros Simples',
    aliases: ['Regime de Capitalização Simples', 'Capitalização Simples'],
  },
  {
    canonicalTopicId: 'canon-port-crase',
    canonicalName: 'Emprego do Sinal Indicativo de Crase',
    aliases: ['Crase', 'Uso da Crase'],
  },
  {
    canonicalTopicId: 'canon-port-concordancia',
    canonicalName: 'Concordância Verbal e Nominal',
    aliases: ['Concordância Nominal', 'Concordância Verbal'],
  },
  {
    canonicalTopicId: 'canon-dir-adm-atos',
    canonicalName: 'Atos Administrativos',
    aliases: ['Ato Administrativo', 'Atributos e Extinção dos Atos Administrativos'],
  },
  {
    canonicalTopicId: 'canon-dir-const-controle',
    canonicalName: 'Controle de Constitucionalidade',
    aliases: ['Controle Difuso e Concentrado', 'ADIN ADC ADPF'],
  },
  {
    canonicalTopicId: 'canon-info-seguranca',
    canonicalName: 'Segurança da Informação',
    aliases: ['Segurança em Redes', 'Malware Criptografia e Firewall'],
  },
]);
