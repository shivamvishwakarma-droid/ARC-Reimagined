/* ============================================================
   ARC-FMS · dummy data store  (client-side, localStorage-backed)
   One source of truth for all prototypes + the Assistant.
   Records data → computes → screens read from here.
   Global: window.ARCDB
   ============================================================ */
(function (global) {
  const KEY = 'arc_fms_store_v3';
  const AY = '2025-2026';
  const TODAY = '2026-07-04';               // fixed "today" for stable demos

  const FEE_HEADERS = [
    { name: 'Term 1 Fee',   amount: 37325, due: '2026-04-10' },
    { name: 'Term 2 Fee',   amount: 28225, due: '2026-06-10' },
    { name: 'Tuition Fees', amount: 15000, due: '2026-04-10' },
    { name: 'Transport',    amount: 15000, due: '2026-04-15' },
    { name: 'Annual Fees',  amount: 68080, due: '2026-04-05' },
    { name: 'Admission Fee',amount: 16000, due: '2026-04-01' },
  ];

  const STUDENTS = [
    { id:'108370', name:'Riona Joel',      cls:'Grade 5',  campus:'Marathahalli',    board:'CBSE', mobile:'9790003152' },
    { id:'25105',  name:'Jaskaran Singh',  cls:'Grade 8',  campus:'Marathahalli',    board:'CBSE', mobile:'9842011234' },
    { id:'342529', name:'Omari Schwarz',   cls:'Grade 5',  campus:'Hennur',          board:'ICSE', mobile:'9600123456' },
    { id:'342534', name:'Riansh H',        cls:'Grade 2',  campus:'Marathahalli',    board:'CBSE', mobile:'9345671122' },
    { id:'336919', name:'Abhigna Singh',   cls:'Grade 1',  campus:'HSR Layout',      board:'ICSE', mobile:'9791234567' },
    { id:'26142',  name:'Kashvika K',      cls:'UKG',      campus:'Marathahalli',    board:'CBSE', mobile:'9884321098' },
    { id:'108455', name:'Shivam Rao',      cls:'Grade 5',  campus:'Marathahalli',    board:'CBSE', mobile:'9600456789' },
    { id:'342780', name:'Shivam Kulkarni', cls:'Grade 8',  campus:'Hennur',          board:'ICSE', mobile:'9500112233' },
    { id:'115902', name:'Shivam Nair',     cls:'Grade 2',  campus:'HSR Layout',      board:'CBSE', mobile:'9345009988' },
    { id:'118293', name:'Diya Rao',        cls:'Grade 10', campus:'Jakkur',          board:'CBSE', mobile:'9791122334' },
    { id:'120344', name:'Aarav Menon',     cls:'Grade 5',  campus:'Yelahanka',       board:'CIE',  mobile:'9884776655' },
    { id:'121567', name:'Ananya Iyer',     cls:'Grade 8',  campus:'Whitefield',      board:'CBSE', mobile:'9600334455' },
    { id:'122890', name:'Kabir Shetty',    cls:'Grade 2',  campus:'Electronic City', board:'ICSE', mobile:'9500667788' },
    { id:'123456', name:'Vivaan Nair',     cls:'Grade 1',  campus:'Marathahalli',    board:'CBSE', mobile:'9791889900' },
  ];

  const REFCHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  function ref(seed){ let s='GQDT-'; for(let i=0;i<11;i++){ seed=(seed*31+7)%REFCHARS.length; s+=REFCHARS[seed]; } return s; }
  function addDays(d, n){ const t=new Date(d+'T00:00:00'); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10); }
  function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
  const fmtDate = d => { const [y,m,dd]=d.split('-'); return dd+'-'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]+'-'+y; };

  /* ---- deterministic seed: assignments (student × fee header) + payments ---- */
  function buildSeed(){
    const assignments=[]; const payments=[]; let pid=1;
    const fh = n => FEE_HEADERS.find(f=>f.name===n);
    STUDENTS.forEach((st, si)=>{
      const headers = ['Term 1 Fee','Transport'];
      if (si % 2 === 0) headers.push('Term 2 Fee');
      headers.forEach((hn, hi)=>{
        const f = fh(hn);
        const lateFee = (si % 5 === 0 && hn==='Term 1 Fee') ? 250 : 0;
        const discount = (si % 6 === 0 && hn==='Term 1 Fee') ? 1500 : 0;
        const netPayable = f.amount + lateFee - discount;
        const a = { studentId: st.id, feeHeader: hn, amount: f.amount, discount, lateFee, due: f.due };
        assignments.push(a);
        // decide payment outcome deterministically — 0 PG · 1 Offline · 2 Auto-Debit · 3 EMI · 4 pending
        const roll = (si + hi*3) % 5;
        const modes = [
          {mode:'PG',        method:'UPI',      st:'Settled'},
          {mode:'Offline',   method:'Cash',     st:'Paid'},
          {mode:'Auto-Debit',method:'NACH',     st:'Paid'},
          {mode:'EMI',       method:'EMI Loan', st:'Registered'},
        ];
        if (roll === 4) {
          // pending — no successful payment (leave a failed attempt on the first header)
          if (hi === 0) payments.push({ id:ref(pid++), studentId:st.id, feeHeader:hn, mode:'PG', method:'Card', amount:netPayable, status:'Failed', date:addDays(f.due,-2), settledOn:null });
        } else {
          const m = modes[roll];
          const payDate = lateFee>0 ? addDays(f.due, 5) : addDays(f.due, -1);   // late-paid rows include the fine
          payments.push({
            id: ref(pid++), studentId: st.id, feeHeader: hn,
            mode: m.mode, method: m.method,
            amount: netPayable, status: m.st,
            date: payDate,
            settledOn: (m.st==='Settled'||m.mode==='PG') ? addDays(payDate,1) : null,
          });
        }
      });
    });
    return { ay: AY, today: TODAY, feeHeaders: FEE_HEADERS, students: STUDENTS, assignments, payments, reminders: [] };
  }

  function load(){ try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.students&&s.payments) return s; }catch(e){} const seed=buildSeed(); save(seed); return seed; }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  let DB = load();

  const RECEIVED = ['Paid','Settled'];          // actual money in
  const isReceived = p => RECEIVED.includes(p.status);

  const api = {
    ay: () => DB.ay,
    today: () => DB.today,
    reset(){ DB = buildSeed(); save(DB); return DB; },
    feeHeaders: () => DB.feeHeaders.slice(),
    students: () => DB.students.slice(),
    findStudent(q){ q=(q||'').toLowerCase().trim(); if(!q) return []; return DB.students.filter(s=> s.name.toLowerCase().includes(q) || s.id===q); },
    student: id => DB.students.find(s=>s.id===id),
    inr: n => '₹'+Math.round(n).toLocaleString('en-IN'),
    fmtDate,

    payments(filter){
      filter = filter||{};
      return DB.payments.filter(p=>{
        if(filter.mode && p.mode!==filter.mode) return false;
        if(filter.status && p.status!==filter.status) return false;
        if(filter.studentId && p.studentId!==filter.studentId) return false;
        return true;
      });
    },

    /* total received (Paid+Settled). opts: {mode, cls, campus} */
    collectionTotal(opts){
      opts=opts||{};
      const byId = Object.fromEntries(DB.students.map(s=>[s.id,s]));
      return DB.payments.filter(isReceived).filter(p=>{
        const s=byId[p.studentId];
        if(opts.mode && p.mode!==opts.mode) return false;
        if(opts.cls && s.cls!==opts.cls) return false;
        if(opts.campus && s.campus!==opts.campus) return false;
        return true;
      }).reduce((a,p)=>a+p.amount,0);
    },
    txnCount(opts){ opts=opts||{}; return DB.payments.filter(p=>!opts.mode||p.mode===opts.mode).length; },
    byMode(){
      const modes=['PG','Auto-Debit','Offline','EMI']; const out={};
      modes.forEach(m=>{ out[m]=DB.payments.filter(p=>p.mode===m && (m==='EMI'?p.status==='Registered':isReceived(p))).reduce((a,p)=>a+p.amount,0); });
      return out;
    },

    /* per student × fee header ledger */
    _ledgerRows(id){
      return DB.assignments.filter(a=>a.studentId===id).map(a=>{
        const pays = DB.payments.filter(p=>p.studentId===id && p.feeHeader===a.feeHeader);
        const paid = pays.filter(isReceived).reduce((x,p)=>x+p.amount,0);
        const emiReg = pays.filter(p=>p.status==='Registered').reduce((x,p)=>x+p.amount,0);
        const net = a.amount + a.lateFee - a.discount;
        const pending = Math.max(0, net - paid - emiReg);
        const overdue = pending>0 ? Math.max(0, daysBetween(a.due, DB.today)) : 0;
        return { ...a, net, paid, emiReg, pending, overdue, payments:pays };
      });
    },
    studentLedger(id){
      const s=api.student(id); if(!s) return null;
      const rows=api._ledgerRows(id);
      const totals={ assigned:0, discount:0, paid:0, emiReg:0, pending:0 };
      rows.forEach(r=>{ totals.assigned+=r.amount+r.lateFee; totals.discount+=r.discount; totals.paid+=r.paid; totals.emiReg+=r.emiReg; totals.pending+=r.pending; });
      return { student:s, rows, totals };
    },
    studentPayments(id){ return DB.payments.filter(p=>p.studentId===id).slice().sort((a,b)=> a.date<b.date?1:-1); },

    /* pending / defaulters */
    _allPending(){
      const list=[];
      DB.students.forEach(s=>{
        const rows=api._ledgerRows(s.id);
        rows.filter(r=>r.pending>0).forEach(r=>{
          list.push({ id:s.id, name:s.name, cls:s.cls, campus:s.campus, feeHeader:r.feeHeader, pending:r.pending, overdue:r.overdue,
                      lastReminder: (DB.reminders.filter(x=>x.studentId===s.id).slice(-1)[0]||{}).when || null });
        });
      });
      return list.sort((a,b)=> b.overdue-a.overdue);
    },
    pendingTotal(){ return api._allPending().reduce((a,r)=>a+r.pending,0); },
    pendingCount(){ return new Set(api._allPending().map(r=>r.id)).size; },
    defaulters(bucket){
      let list=api._allPending();
      if(bucket==='0')  list=list.filter(r=>r.overdue<=30);
      if(bucket==='1')  list=list.filter(r=>r.overdue>30 && r.overdue<=60);
      if(bucket==='2')  list=list.filter(r=>r.overdue>60);
      return list;
    },

    /* fee-header collection summary */
    feeHeaderCollection(){
      return DB.feeHeaders.map(f=>{
        const asg=DB.assignments.filter(a=>a.feeHeader===f.name);
        if(!asg.length) return null;
        let total=0,discount=0,paid=0,pending=0;
        asg.forEach(a=>{
          total += a.amount + a.lateFee;
          discount += a.discount;
          const pays=DB.payments.filter(p=>p.studentId===a.studentId && p.feeHeader===a.feeHeader);
          const pd=pays.filter(isReceived).reduce((x,p)=>x+p.amount,0);
          const emi=pays.filter(p=>p.status==='Registered').reduce((x,p)=>x+p.amount,0);
          paid += pd;
          pending += Math.max(0, a.amount+a.lateFee-a.discount-pd-emi);
        });
        return { name:f.name, total, discount, paid, pending, students:asg.length };
      }).filter(Boolean);
    },

    /* mutations */
    recordPayment({studentId, feeHeader, amount, mode, method}){
      const p={ id:ref(DB.payments.length+9), studentId, feeHeader, mode:mode||'Offline', method:method||'Cash', amount:+amount, status:(mode==='EMI'?'Registered':'Paid'), date:DB.today, settledOn:null };
      DB.payments.push(p); save(DB); return p;
    },
    sendReminder(studentId, channel){ DB.reminders.push({ studentId, channel:channel||'WhatsApp', when:'just now' }); save(DB); },
  };

  global.ARCDB = api;
})(window);
