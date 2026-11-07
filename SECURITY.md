# Segurança

## Relatar vulnerabilidades

Não publique vulnerabilidades com dados pessoais em uma issue pública. Entre em contato com a mantenedora pelo perfil do GitHub e forneça uma reprodução mínima sem backups reais.

## Dados locais

O aplicativo armazena dados no navegador. Backups exportados podem conter notas e histórico de estudo; trate-os como arquivos pessoais. Não faça commit desses arquivos.

A sincronização WebDAV cifra o backup no navegador. Use uma frase de pelo menos 12 caracteres e guarde-a: sem ela o backup remoto não pode ser recuperado. Veja o estado das proteções em [SECURITY-AUDIT.md](SECURITY-AUDIT.md).

Antes de importar um backup, confirme sua origem. O aplicativo valida estrutura, limites e referências, mas arquivos pessoais ainda devem ser mantidos em local seguro.
