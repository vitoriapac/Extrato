import { h, type ComponentType, type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/**
 * Componente carregado sob demanda: o módulo só é baixado na primeira montagem
 * (vira um pedaço separado no build ESM) e a tela se desenha quando ele chega.
 * Os controladores continuam montando com h(View, props), sem saber da carga.
 */
export function lazyView<P extends object>(
  load: () => Promise<ComponentType<P>>
): (props: P) => VNode | null {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<void> | null = null;
  const start = () =>
    (pending ||= load().then(
      component => {
        Loaded = component;
      },
      error => {
        pending = null; // permite tentar de novo na próxima abertura (p.ex. voltou a rede)
        console.warn('Não foi possível carregar esta tela agora.', error);
      }
    ));
  return function LazyView(props: P) {
    const [, setReady] = useState(Loaded !== null);
    // Modal montado fechado (open=false) só baixa o pedaço quando abrir.
    const waiting = (props as { open?: boolean }).open === false;
    useEffect(() => {
      if (Loaded || waiting) return;
      let alive = true;
      start().then(() => {
        if (alive && Loaded) setReady(true);
      });
      return () => {
        alive = false;
      };
    }, [waiting]);
    return Loaded ? (h(Loaded as unknown as ComponentType<object>, props) as VNode) : null;
  };
}
