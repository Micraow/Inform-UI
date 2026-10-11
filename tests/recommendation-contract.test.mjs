import test from 'node:test';import assert from 'node:assert/strict';import Ajv from 'ajv';
import {recommendationCardSchema} from '../scripts/recommendation-card-schema.mjs';
const validate=new Ajv({strict:true}).compile(recommendationCardSchema());
const fixture=()=>({type:'recommendation-card',label:'Suggested conversation',status:'resolved',canOpenConversation:true,data:{conversationId:'supplied-topic',title:'A supplied title',description:'A supplied description'}});
test('explicit resolved data and capability',()=>{assert.equal(validate(fixture()),true);for(const field of ['data','canOpenConversation','status']){const x=fixture();delete x[field];assert.equal(validate(x),false)}});
test('pending and failed are separate envelopes',()=>{for(const status of ['pending','failed']){assert.equal(validate({type:'recommendation-card',label:'Card',status}),true);assert.equal(validate({...fixture(),status}),false)}});
test('closed supplied contract rejects host APIs and arbitrary extras',()=>{for(const field of ['__state','account','url','onClick','children'])assert.equal(validate({...fixture(),[field]:'x'}),false)});
test('bounded text and non-whitespace conversation keys',()=>{for(const conversationId of ['','x y','x\n','x'.repeat(201)]){const x=fixture();x.data.conversationId=conversationId;assert.equal(validate(x),false)}const x=fixture();x.data.title='x'.repeat(501);assert.equal(validate(x),false)});
