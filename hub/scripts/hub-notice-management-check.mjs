import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderHubBoard} from '../src/ui/hubBoard.js';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../src/lib/hubBoardApi.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/hub-board.css',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../database/migrations/LAC_HUB_NOTICE_MANAGEMENT_20260926.sql',import.meta.url),'utf8');
const state={platformAdmin:true,companies:[],session:{user:{id:'u'}},hubBoard:{notices:[{id:'n1',title:'테스트 공지',body:'테스트 본문',published_at:'2026-09-22'}],tickets:[],mode:'notice',tab:'notices',noticeId:'n1',filterContent:'all',filterCategory:'all',filterStatus:'all',searchQuery:''}};
const detail=renderHubBoard(state);
assert.match(detail,/hub-board-notice-edit/);assert.match(detail,/hub-board-notice-delete/);
const edit=renderHubBoard({...state,hubBoard:{...state.hubBoard,mode:'notice-edit'}});
assert.match(edit,/data-form="hub-board-notice-edit"/);assert.match(edit,/value="테스트 공지"/);assert.match(edit,/테스트 본문/);
const nonAdmin=renderHubBoard({...state,platformAdmin:false});
assert.doesNotMatch(nonAdmin,/hub-board-notice-edit/);assert.doesNotMatch(nonAdmin,/hub-board-notice-delete/);
for(const token of ['updateHubNotice','deleteHubNotice','hub-board-notice-edit','hub-board-notice-delete'])assert.ok(main.includes(token),token);
for(const token of ['hub_board_update_notice','hub_board_delete_notice']){assert.ok(api.includes(token),token);assert.ok(sql.includes(token),token);}
assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
console.log('NOTICE MANAGEMENT PASS: admin edit/delete, prefilled edit form, non-admin hidden, RPC migration, home alignment.');
