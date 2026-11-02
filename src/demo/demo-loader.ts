declare const __STUDYTRACK_BUILD_VERSION__: string;

type DemoGenerator = (options: { today: string }) => Record<string, any>;
let pending: Promise<DemoGenerator> | null = null;

/** Loads src/demo.bundle.js once (precached by the service worker) and returns its generator. */
export function loadDemoGenerator(doc: Document = document): Promise<DemoGenerator> {
  const ready = () => (globalThis as Record<string, any>).StudyTrackDemo?.generateDemoData as
    | DemoGenerator
    | undefined;
  if (ready()) return Promise.resolve(ready()!);
  if (!pending) {
    const version =
      typeof __STUDYTRACK_BUILD_VERSION__ !== 'undefined' ? __STUDYTRACK_BUILD_VERSION__ : 'dev';
    pending = new Promise<DemoGenerator>((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = new URL(`src/demo.bundle.js?v=${version}`, doc.baseURI).href;
      script.async = true;
      script.onload = () =>
        ready()
          ? resolve(ready()!)
          : reject(new Error('A demonstração não carregou corretamente.'));
      script.onerror = () =>
        reject(
          new Error('Não foi possível carregar a demonstração. Conecte-se à internet e tente novamente.')
        );
      doc.head.appendChild(script);
    }).catch(error => {
      pending = null;
      throw error;
    });
  }
  return pending;
}
