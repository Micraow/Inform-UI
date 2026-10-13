import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod/v4';
import Ajv2020 from 'ajv/dist/2020.js';
import { preserveTupleInputArity } from '../dist/index.mjs';
const exportSchema = schema => z.toJSONSchema(schema, { override: preserveTupleInputArity });
const ajv = new Ajv2020({ strict:false });
// The library uses Zod registry `id` as a naming annotation, not legacy schema identity.
ajv.removeKeyword('id');
function parity(schema, values) {
  const jsonSchema=exportSchema(schema), validate=ajv.compile(jsonSchema);
  for(const value of values) assert.equal(validate(value),schema.safeParse(value).success,JSON.stringify({jsonSchema,value,errors:validate.errors}));
  return jsonSchema;
}
const values=[[],['a'],['a',1],['a',1,true],['a',1,true,false],['a',true],['a',null],[null],[1],[null,1]];
test('fixed required tuple exports min/max/items false; original export demonstrates gap',()=>{
  const schema=z.tuple([z.string(),z.number()]); const old=z.toJSONSchema(schema);
  assert.equal(ajv.compile(old)(['a']),true); assert.equal(schema.safeParse(['a']).success,false);
  const json=parity(schema,values); assert.equal(json.minItems,2);assert.equal(json.maxItems,2);assert.equal(json.items,false);
});
test('trailing optional fields permit a shorter tuple',()=>{
  const json=parity(z.tuple([z.string(),z.number().optional()]),values);assert.equal(json.minItems,1);assert.equal(json.maxItems,2);
});
test('middle optional does not permit omission of a required trailing field',()=>{
  const json=parity(z.tuple([z.string().optional(),z.number()]),values);assert.equal(json.minItems,2);
});
test('pinned all-optional tuple without rest retains parser full-length requirement',()=>{
  const json=parity(z.tuple([z.string().optional(),z.number().optional()]),values);assert.equal(json.minItems,2);
});
test('empty tuple accepts only empty array',()=>{
  const json=parity(z.tuple([]),values);assert.equal(json.minItems,0);assert.equal(json.maxItems,0);assert.equal(json.items,false);
});
test('rest tuple retains the tail schema and has no artificial maximum',()=>{
  const json=parity(z.tuple([z.string()]).rest(z.number()),values);assert.equal(json.minItems,1);assert.equal(json.maxItems,undefined);assert.deepEqual(json.items,{type:'number'});
});
test('optional tail before rest is optional but still occupies its positional slot',()=>{
  const json=parity(z.tuple([z.string(),z.number().optional()]).rest(z.boolean()),values);assert.equal(json.minItems,1);assert.equal(json.maxItems,undefined);
});
test('all-optional with rest accepts empty, unlike pinned closed tuple',()=>{
  const json=parity(z.tuple([z.string().optional(),z.number().optional()]).rest(z.boolean()),values);assert.equal(json.minItems,0);
});
test('any/unknown prefix with rest may be absent',()=>{
  for(const field of[z.any(),z.unknown(),z.unknown().nullable(),z.union([z.number(),z.any()])])assert.equal(parity(z.tuple([field]).rest(z.number()),values).minItems,0);
});
test('default-valued optional input and nullable required input are distinct',()=>{
  assert.equal(parity(z.tuple([z.string(),z.number().default(1)]),values).minItems,1);
  assert.equal(parity(z.tuple([z.string(),z.number().nullable()]),values).minItems,2);
});
test('nested, optional, union, and registered-ref tuples all receive the override',()=>{
  const pair=z.tuple([z.string(),z.number()]);const registry=z.registry();registry.add(pair,{id:'Pair'});
  const schema=z.strictObject({pair:pair.optional(),list:z.array(pair),range:z.union([z.literal('6m'),pair])});
  const json=z.toJSONSchema(schema,{metadata:registry,override:preserveTupleInputArity});
  assert.deepEqual([json.$defs.Pair.minItems,json.$defs.Pair.maxItems,json.$defs.Pair.items],[2,2,false]);
  const validate=ajv.compile(json);for(const v of[{list:[],range:'6m'},{list:[['a',1]],range:['a',1]},{list:[['a']],range:'6m'},{pair:['a',1,2],list:[],range:'6m'}])assert.equal(validate(v),schema.safeParse(v).success);
});
test('explicit tuple length checks remain intersected with structural bounds',()=>{
  const tuple=z.tuple([z.string(),z.number().optional()]).check(z.minLength(2));
  assert.equal(parity(tuple,values).minItems,2);
  const rest=z.tuple([z.string()]).rest(z.number()).check(z.maxLength(2));
  assert.equal(parity(rest,values).maxItems,2);
});
