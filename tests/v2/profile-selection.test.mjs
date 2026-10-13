import test from 'node:test';
import assert from 'node:assert/strict';
import {selectShowcaseProfile} from '../../showcase-next/profile-selection.mjs';
const catalog={components:[{name:'Stack',moduleId:'base/layout'},{name:'Text',moduleId:'base/text'},{name:'BarChart',moduleId:'base/charts'},{name:'CardView',moduleId:'views/content'},{name:'TabPanelView',moduleId:'views/content'},{name:'WeatherCard',moduleId:'domain/weather'}],dataShapes:[{name:'Series',moduleId:'base/chart-data'},{name:'CardData',moduleId:'views/content'}]};
test('base answers do not allocate every migrated View schema',()=>{const p=selectShowcaseProfile('root=Stack([Text("Hello")])',catalog);assert.deepEqual(p,{select:['base/layout','base/text'],viewNames:[]});});
test('called Views and data constructors get their own catalog modules',()=>{const p=selectShowcaseProfile('root=Stack([CardView({title:"Hi"}),BarChart("Count",["A"],[Series("One",[2])])])',catalog);assert.deepEqual(p.viewNames,['CardView']);assert.ok(p.select.includes('base/chart-data'));assert.ok(p.select.includes('views/content'));});
test('standalone View data keeps its real family, unknown names stay strict runtime errors',()=>{const p=selectShowcaseProfile('data=CardData("a")\nroot=Stack([FakeView()])',catalog);assert.deepEqual(p.viewNames,['CardView','TabPanelView']);assert.ok(!p.select.includes('FakeView'));});
