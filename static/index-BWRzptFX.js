import{i as v,_ as V}from"./index-D604ZND0.js";import{b as P,B as k}from"./element-CaKE2_v0.js";import{m as I,r as i,f as _,c as S,ai as r,p as A,q as w,U as t,O as l,S as f}from"./vue-whfKlJIt.js";import"./vxe-HN9Qqgrb.js";const F=I({name:"Pod",setup(){const e=i([]),n=i(1),h=i(10),p=i(!1),m=i("新增Pod"),u=i({name:"",namespace:"default",labels:{},annotations:null,status:{phase:"Pending",conditions:[],hostIP:"",hostIPs:[],podIP:"",podIPs:[],startTime:"",containerStatuses:[{name:"container-name",state:{running:{startedAt:""}},lastState:{terminated:{exitCode:0,reason:"",startedAt:"",finishedAt:"",containerID:""}},ready:!1,restartCount:0,image:"nginx:latest",imageID:"",containerID:"",started:!1}],qosClass:""},creationTime:""}),d=_(()=>{const a=(n.value-1)*h.value,o=a+h.value;return e.value.slice(a,o)}),s=async()=>{try{const a=await v({url:"/apis/v1/k8s/pods/kube-system",method:"get",baseURL:"http://localhost:8080"});e.value=a}catch(a){console.error("获取Pod数据失败:",a)}},C=a=>{n.value=a},b=()=>{m.value="新增Pod",u.value={name:"",namespace:"default",labels:{},annotations:null,status:{phase:"Pending",conditions:[],hostIP:"",hostIPs:[],podIP:"",podIPs:[],startTime:"",containerStatuses:[{name:"container-name",state:{running:{startedAt:""}},lastState:{terminated:{exitCode:0,reason:"",startedAt:"",finishedAt:"",containerID:""}},ready:!1,restartCount:0,image:"nginx:latest",imageID:"",containerID:"",started:!1}],qosClass:""},creationTime:""},p.value=!0},c=a=>{m.value="编辑Pod",u.value=JSON.parse(JSON.stringify(a)),p.value=!0},g=async()=>{try{m.value==="新增Pod"?(await v({url:"/apis/v1/k8s/pods",method:"post",data:u.value,baseURL:"http://localhost:8080"}),P.success("Pod新增成功")):(await v({url:`/apis/v1/k8s/pods/${u.value.name}`,method:"put",data:u.value,baseURL:"http://localhost:8080"}),P.success("Pod编辑成功")),p.value=!1,s()}catch(a){console.error("保存Pod失败:",a),P.error("保存Pod失败")}},D=a=>{k.confirm(`确定删除Pod ${a.name} 吗？`,"提示",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"}).then(async()=>{try{await v({url:`/apis/v1/k8s/pods/${a.name}`,method:"delete",baseURL:"http://localhost:8080"}),P.success("Pod删除成功"),s()}catch(o){console.error("删除Pod失败:",o),P.error("删除Pod失败")}})};return S(()=>{s()}),{podData:e,currentPage:n,pageSize:h,currentPageData:d,handlePageChange:C,dialogVisible:p,dialogTitle:m,currentPod:u,handleAdd:b,handleEdit:c,handleSave:g,handleDelete:D}}});function U(e,n,h,p,m,u){const d=r("el-table-column"),s=r("el-button"),C=r("el-table"),b=r("el-pagination"),c=r("el-input"),g=r("el-form-item"),D=r("el-form"),a=r("el-dialog");return A(),w("div",null,[t(C,{data:e.currentPageData,border:"",stripe:"",style:{width:"100%"}},{default:l(()=>[t(d,{prop:"name",label:"Pod名称",width:"180"}),t(d,{prop:"namespace",label:"命名空间",width:"180"}),t(d,{prop:"status.phase",label:"状态",width:"180"}),t(d,{prop:"status.containerStatuses[0].image",label:"镜像",width:"300"}),t(d,{label:"操作",width:"200"},{default:l(({row:o})=>[t(s,{type:"primary",onClick:y=>e.handleEdit(o)},{default:l(()=>[f("编辑")]),_:2},1032,["onClick"]),t(s,{type:"danger",onClick:y=>e.handleDelete(o)},{default:l(()=>[f("删除")]),_:2},1032,["onClick"])]),_:1})]),_:1},8,["data"]),t(b,{currentPage:e.currentPage,"onUpdate:currentPage":n[0]||(n[0]=o=>e.currentPage=o),"page-size":e.pageSize,total:e.podData.length,layout:"total, prev, pager, next, jumper",onCurrentChange:e.handlePageChange},null,8,["currentPage","page-size","total","onCurrentChange"]),t(a,{title:e.dialogTitle,modelValue:e.dialogVisible,"onUpdate:modelValue":n[5]||(n[5]=o=>e.dialogVisible=o)},{footer:l(()=>[t(s,{onClick:n[4]||(n[4]=o=>e.dialogVisible=!1)},{default:l(()=>[f("取消")]),_:1}),t(s,{type:"primary",onClick:e.handleSave},{default:l(()=>[f("保存")]),_:1},8,["onClick"])]),default:l(()=>[t(D,{model:e.currentPod,"label-width":"120px"},{default:l(()=>[t(g,{label:"Pod名称"},{default:l(()=>[t(c,{modelValue:e.currentPod.name,"onUpdate:modelValue":n[1]||(n[1]=o=>e.currentPod.name=o)},null,8,["modelValue"])]),_:1}),t(g,{label:"命名空间"},{default:l(()=>[t(c,{modelValue:e.currentPod.namespace,"onUpdate:modelValue":n[2]||(n[2]=o=>e.currentPod.namespace=o)},null,8,["modelValue"])]),_:1}),t(g,{label:"镜像"},{default:l(()=>[t(c,{modelValue:e.currentPod.status.containerStatuses[0].image,"onUpdate:modelValue":n[3]||(n[3]=o=>e.currentPod.status.containerStatuses[0].image=o)},null,8,["modelValue"])]),_:1})]),_:1},8,["model"])]),_:1},8,["title","modelValue"]),t(s,{type:"success",onClick:e.handleAdd},{default:l(()=>[f("新增Pod")]),_:1},8,["onClick"])])}const q=V(F,[["render",U],["__scopeId","data-v-352ead88"]]);export{q as default};
