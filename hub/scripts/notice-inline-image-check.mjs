import assert from 'node:assert/strict';
import fs from 'node:fs';
import {noticeBodyForEditor,serializeNoticeEditorBody,noticeImagePaths,noticeBodySegments} from '../src/lib/hubNoticeMedia.js';

const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../src/ui/hubBoard.js',import.meta.url),'utf8');
const info=fs.readFileSync(new URL('../src/ui/infoPage.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles/hub-board.css',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../database/migrations/LAC_HUB_NOTICE_INLINE_IMAGES_20260926.sql',import.meta.url),'utf8');

const path='notices/123e4567-e89b-12d3-a456-426614174000.webp';
const stored=`첫 문단\n[[LAC_NOTICE_IMAGE|${path}]]\n둘째 문단`;
const parsed=noticeBodyForEditor(stored,p=>`https://example.test/${p}`);
assert.equal(parsed.media.length,1);
assert.match(parsed.editorBody,/\[\[사진 1\]\]/);
assert.equal(serializeNoticeEditorBody(parsed.editorBody,parsed.media),stored);
assert.deepEqual(noticeImagePaths(stored),[path]);
assert.equal(noticeBodySegments(stored).filter(item=>item.type==='image').length,1);

assert.match(main,/addHubNoticeImages/);
assert.match(main,/clipboardData/);
assert.match(main,/serializeNoticeEditorBody/);
assert.match(ui,/data-hub-notice-images/);
assert.match(ui,/data-hub-notice-body/);
assert.match(ui,/hub-board__notice-image/);
assert.match(css,/hub-board__notice-preview/);
assert.match(sql,/lac-hub-notice-images/);
assert.match(sql,/platform_is_admin\(\)/);
const modbookStart=info.indexOf('const modbookDetailPanel=');
const modbookEnd=info.indexOf('\n};',modbookStart)+3;
const modbookPanel=info.slice(modbookStart,modbookEnd);
assert.ok(!modbookPanel.includes('추가 정보'));
assert.ok(!modbookPanel.includes('game-modbook-detail__panel--support'));
console.log('PASS · 공지 이미지 붙여넣기/파일 업로드 토큰 라운드트립');
console.log('PASS · 관리자 전용 Storage 정책 및 공개 공지 이미지 버킷');
console.log('PASS · 공지 본문 위치 기반 이미지 렌더링 연결');
console.log('PASS · 개조서 사용자 상세의 추가 정보 영역 제거');
