import { getFallbackColor, getImageSrc } from '../../content/images';

export function AssetImage(
  imageKey: string,
  className = 'card__image',
  alt = '',
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = className + '-wrap';

  const img = document.createElement('img');
  img.className = className;
  img.alt = alt || imageKey;
  img.src = getImageSrc(imageKey);

  const fallback = document.createElement('div');
  fallback.className = className + ' asset-fallback';
  fallback.style.backgroundColor = getFallbackColor(imageKey);
  fallback.style.width = '64px';
  fallback.style.height = '64px';
  fallback.style.display = 'none';
  fallback.style.borderRadius = '4px';
  fallback.style.alignItems = 'center';
  fallback.style.justifyContent = 'center';
  fallback.style.fontSize = '10px';
  fallback.textContent = imageKey.slice(0, 6);

  img.onerror = () => {
    img.style.display = 'none';
    fallback.style.display = 'flex';
  };

  wrap.appendChild(img);
  wrap.appendChild(fallback);
  return wrap;
}
