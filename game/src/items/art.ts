import {assetUrl} from '../assets.ts';
/** Asset IDs match assets/manifest.json; saves never contain image URLs. */
export function itemIconUrl(assetId?:string):string|null {
 const match=/^item\.([a-z0-9-]+)\.(b\d+)$/.exec(assetId??'');
 return match?assetUrl(`assets/production/items/${match[1]}-${match[2]}.png`):null;
}
