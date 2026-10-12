import {string,short,number,bool,integer,choice,array,object,ref,key,color,weight,align,children,scalar} from '../primitives.mjs';
import {nullableNumber,probability,condition,timestamp,date} from '../primitives.mjs';
import {installWeatherSuppliedSchema} from '../../weather-supplied-schema.mjs';
export function install({node,defs}) {
node('weather', { location: object({ name: short, timezone: short }, ['name', 'timezone']), updatedAt: timestamp, source: object({ label: short, url: string(2048), synthetic: bool }, ['label', 'synthetic']), units: object({ temperature: choice('celsius', 'fahrenheit') }, ['temperature']), current: object({ time: timestamp, temperature: nullableNumber, feelsLike: nullableNumber, condition, humidity: probability }, ['time', 'temperature', 'condition']), daily: array(object({ date, low: nullableNumber, high: nullableNumber, condition, precipitationProbability: probability }, ['date', 'low', 'high', 'condition', 'precipitationProbability']), 0, 16), hourly: array(object({ time: timestamp, temperature: nullableNumber, precipitationProbability: probability }, ['time', 'temperature', 'precipitationProbability']), 0, 384), initialDate: date, status: choice('ready', 'loading', 'error'), message: string() }, ['location', 'updatedAt', 'source', 'units', 'current', 'daily', 'hourly'], 'weather');
installWeatherSuppliedSchema({defs});
}
