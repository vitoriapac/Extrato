// Locator screenshots round both clip edges. A fractional document origin can
// add a pixel without any change to the component's dimensions or content.
export async function withPixelAlignedCapture(locator,capture){
  const original=await locator.evaluate(async element=>{
    await element.ownerDocument.fonts.ready;
    const view=element.ownerDocument.defaultView;
    if(view.getComputedStyle(element).translate!=='none')throw Error('Capture alignment requires an untranslated surface');
    const rect=element.getBoundingClientRect(),left=rect.left+view.scrollX,top=rect.top+view.scrollY;
    const saved=element.style.translate;
    element.style.translate=`${Math.round(left)-left}px ${Math.round(top)-top}px`;
    return saved;
  });
  try{return await capture()}finally{await locator.evaluate((element,value)=>{element.style.translate=value},original)}
}
