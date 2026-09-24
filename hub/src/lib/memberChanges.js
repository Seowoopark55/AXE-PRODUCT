// Build one membership UPDATE payload. Pure logic is shared by unsaved-change
// detection and submit, so the two cannot disagree about what will be saved.
export function memberChanges(row, data) {
  if (!row || !data) throw new Error('멤버 정보를 다시 확인해 주세요.');
  const role = String(data.get('role') || '');
  const status = String(data.get('status') || '');
  if (!['owner', 'admin', 'manager', 'member'].includes(role) ||
      !['active', 'suspended', 'left'].includes(status)) {
    throw new Error('올바른 역할과 상태를 선택해 주세요.');
  }
  if (row.role === 'owner' && (role !== row.role || status !== row.status)) {
    throw new Error('대표 계정의 역할과 상태는 일반 멤버 관리창에서 변경할 수 없습니다.');
  }
  if (row.role !== 'owner' && role === 'owner') {
    throw new Error('대표 권한은 일반 멤버 관리창에서 부여할 수 없습니다.');
  }
  const alias = String(data.get('alias_name') || '').trim();
  const startedOn = String(data.get('employment_started_on') || '').trim();
  const note = String(data.get('member_note') || '').trim();
  if (alias.length > 120 || note.length > 1000) throw new Error('별칭 또는 메모의 입력 길이를 확인해 주세요.');
  if (startedOn && !/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) throw new Error('입사일을 확인해 주세요.');
  const changes = {};
  if (String(row.alias_name || '').trim() !== alias) changes.alias_name = alias || null;
  if (row.role !== role) changes.role = role;
  if (row.status !== status) changes.status = status;
  if (String(row.employment_started_on || '').slice(0, 10) !== startedOn) changes.employment_started_on = startedOn || null;
  if (String(row.member_note || '').trim() !== note) changes.member_note = note || null;
  return changes;
}
