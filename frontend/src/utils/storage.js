// src/utils/storage.js
const KEY = "plant_analysis_meta";

export function savePlantMeta(m){ try{sessionStorage.setItem(KEY, JSON.stringify(m));}catch{} }
export function loadPlantMeta(){ try{const r=sessionStorage.getItem(KEY); return r?JSON.parse(r):null;}catch{return null;} }
export function clearPlantMeta(){ try{sessionStorage.removeItem(KEY);}catch{} }
