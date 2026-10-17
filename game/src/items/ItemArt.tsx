import {useState} from 'react';
import type {Item} from './catalog';
import type {Locale} from '../i18n';
import {translate} from '../i18n';
import {itemIconUrl} from './art';

/** Missing art is explicit. Do not silently pass an occupied slot off as an empty-slot glyph. */
export function ItemArt({item,locale}:{item?:Item|null;locale:Locale}){
 const src=itemIconUrl(item?.iconAssetId),[failedSrc,setFailedSrc]=useState<string|null>(null);
 if(!src||failedSrc===src)return <span className="item-art item-art-missing" role="img" aria-label={translate(locale,'equipment.missingArt')} title={translate(locale,'equipment.missingArt')}>?</span>;
 return <img className="item-art" src={src} alt="" aria-hidden="true" draggable={false} onError={()=>setFailedSrc(src)}/>;
}
