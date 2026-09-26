/* 翻译剩余的 #subtitle: 作者注解行(引擎注释,不渲染;翻译以保持文件完整性)。 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'source/scenes');

const M = {
  'government_affairs/agricultural_policy.scene.dry': '农民融资、粮食收购与土地改革等议题。',
  'government_affairs/coalition_affairs.scene.dry': '执政联盟内部存在异议。',
  'government_affairs/constitutional_reform.scene.dry': '对政府体制的重大改动。',
  'government_affairs/council_affairs.scene.dry': '德国工人委员会的管理事务。',
  'government_affairs/dealing_with_toleration.scene.dry': '尽管我们不在政府之中,但我们仍能提供支持。',
  'government_affairs/economic_democracy.scene.dry': '我们怎样才能让工人对生产资料拥有更多控制权?',
  'government_affairs/economic_policy.scene.dry': '应对经济危机的政策。',
  'government_affairs/fiscal_policy.scene.dry': '税收、预算与关税等议题。',
  'government_affairs/foreign_policy.scene.dry': '国际关系与对《凡尔赛条约》的应对。',
  'government_affairs/labor_affairs.scene.dry': '处理劳工骚动与罢工。',
  'government_affairs/labor_rights.scene.dry': '工时、安全法规与失业保险。',
  'government_affairs/military_policy.scene.dry': '与国防军打交道。',
  'government_affairs/prussian_affairs.scene.dry': '普鲁士州政府是民主的堡垒……',
  'party_affairs/ideology.scene.dry': '确立本党的意识形态方向。',
  'party_affairs/international_relations.scene.dry': '与各兄弟社会主义政党建立联系。',
  'party_affairs/inter_party_relationships.scene.dry': '与德国其他政党建立关系。',
  'party_affairs/media.scene.dry': '为本党的报纸与广播确立方向。',
  'party_affairs/party_organizations.scene.dry': '在选举政治之外,社民党自成一个社会世界。',
  'party_affairs/peoples_party.scene.dry': '社民党能否走出工人阶级之外?',
  'party_affairs/reichsbanner.scene.dry': '为保卫共和国而进行的准军事组织。',
  'presidential_affairs/thuringia_crisis.scene.dry': '纳粹党统治着图林根,并正充分利用这一点',
};

let n = 0;
for (const [rel, zh] of Object.entries(M)) {
  const p = path.join(root, rel);
  const src = fs.readFileSync(p, 'utf8');
  const out = src.replace(/^#subtitle:.*$/m, '#subtitle: ' + zh);
  if (out !== src) { fs.writeFileSync(p, out); n++; }
}
console.log('替换 #subtitle 行:', n);
