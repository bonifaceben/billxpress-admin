export function sliderPayload(form, original, imageBase64 = '') {
  const values = {
    title: form.title.trim(),
    linkUrl: form.linkUrl.trim(),
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder),
  };
  if (form.sortOrder === '' || !Number.isSafeInteger(values.sortOrder)) {
    throw new Error('Enter a whole number for sort order.');
  }
  const payload = original
    ? Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== (original[key] ?? (key === 'isActive' ? true : key === 'sortOrder' ? 0 : ''))))
    : values;
  if (imageBase64) payload.imageBase64 = imageBase64;
  else if (!original || form.imageUrl.trim() !== original.imageUrl) {
    if (!form.imageUrl.trim()) throw new Error('Upload an image or enter its hosted URL.');
    const url = new URL(form.imageUrl.trim());
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS image URL.');
    payload.imageUrl = url.href;
  }
  return payload;
}
