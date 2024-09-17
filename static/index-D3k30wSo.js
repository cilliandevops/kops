import{i as h,_ as U}from"./index-D604ZND0.js";import{b as i,B as w}from"./element-CaKE2_v0.js";import{m as F,r as p,f as P,c as $,ai as s,p as _,q as y,U as a,O as l,S as v,F as B,a8 as S}from"./vue-whfKlJIt.js";import"./vxe-HN9Qqgrb.js";const E=F({name:"ConfigMap",setup(){const e=p([]),o=p(1),M=p(10),m=p(!1),c=p("新增ConfigMap"),u=p({metadata:{name:"",namespace:"default"},data:{}}),f=P(()=>{const t=(o.value-1)*M.value,n=t+M.value;return e.value.slice(t,n)}),r=async()=>{try{const t=await h({url:"/apis/v1/k8s/configmaps/default",method:"get",baseURL:"http://localhost:8080"});e.value=t||[]}catch(t){console.error("获取ConfigMap数据失败:",t),i.error("获取ConfigMap数据失败")}},b=t=>{o.value=t},V=()=>{c.value="新增ConfigMap",u.value={metadata:{name:"",namespace:"default"},data:{}},m.value=!0},g=t=>{c.value="编辑ConfigMap",u.value=JSON.parse(JSON.stringify(t)),m.value=!0},C=async()=>{try{if(!u.value.metadata.name){i.error("ConfigMap名称不能为空");return}c.value==="新增ConfigMap"?(await h({url:"/apis/v1/k8s/configmaps",method:"post",data:u.value,baseURL:"http://localhost:8080"}),i.success("ConfigMap新增成功")):(await h({url:`/apis/v1/k8s/configmaps/${u.value.metadata.name}`,method:"put",data:u.value,baseURL:"http://localhost:8080"}),i.success("ConfigMap编辑成功")),m.value=!1,r()}catch(t){console.error("保存ConfigMap失败:",t),i.error("保存ConfigMap失败")}},D=t=>{w.confirm(`确定删除ConfigMap ${t.metadata.name} 吗？`,"提示",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"}).then(async()=>{try{await h({url:`/apis/v1/k8s/configmaps/${t.metadata.name}`,method:"delete",baseURL:"http://localhost:8080"}),i.success("ConfigMap删除成功"),r()}catch(n){console.error("删除ConfigMap失败:",n),i.error("删除ConfigMap失败")}})};return $(()=>{r()}),{configMapData:e,currentPage:o,pageSize:M,currentPageData:f,handlePageChange:b,dialogVisible:m,dialogTitle:c,currentConfigMap:u,handleAdd:V,handleEdit:g,handleSave:C,handleDelete:D}}});function A(e,o,M,m,c,u){const f=s("el-table-column"),r=s("el-button"),b=s("el-table"),V=s("el-pagination"),g=s("el-input"),C=s("el-form-item"),D=s("el-form"),t=s("el-dialog");return _(),y("div",null,[a(b,{data:e.currentPageData,border:"",stripe:"",style:{width:"100%"}},{default:l(()=>[a(f,{prop:"metadata.name",label:"ConfigMap名称",width:"180"}),a(f,{prop:"metadata.namespace",label:"命名空间",width:"180"}),a(f,{label:"操作",width:"200"},{default:l(({row:n})=>[a(r,{type:"primary",onClick:d=>e.handleEdit(n)},{default:l(()=>[v("编辑")]),_:2},1032,["onClick"]),a(r,{type:"danger",onClick:d=>e.handleDelete(n)},{default:l(()=>[v("删除")]),_:2},1032,["onClick"])]),_:1})]),_:1},8,["data"]),a(V,{currentPage:e.currentPage,"onUpdate:currentPage":o[0]||(o[0]=n=>e.currentPage=n),"page-size":e.pageSize,total:e.configMapData.length,layout:"total, prev, pager, next, jumper",onCurrentChange:e.handlePageChange},null,8,["currentPage","page-size","total","onCurrentChange"]),a(t,{title:e.dialogTitle,modelValue:e.dialogVisible,"onUpdate:modelValue":o[4]||(o[4]=n=>e.dialogVisible=n)},{footer:l(()=>[a(r,{onClick:o[3]||(o[3]=n=>e.dialogVisible=!1)},{default:l(()=>[v("取消")]),_:1}),a(r,{type:"primary",onClick:e.handleSave},{default:l(()=>[v("保存")]),_:1},8,["onClick"])]),default:l(()=>[a(D,{model:e.currentConfigMap,"label-width":"120px"},{default:l(()=>[a(C,{label:"ConfigMap名称"},{default:l(()=>[a(g,{modelValue:e.currentConfigMap.metadata.name,"onUpdate:modelValue":o[1]||(o[1]=n=>e.currentConfigMap.metadata.name=n)},null,8,["modelValue"])]),_:1}),a(C,{label:"命名空间"},{default:l(()=>[a(g,{modelValue:e.currentConfigMap.metadata.namespace,"onUpdate:modelValue":o[2]||(o[2]=n=>e.currentConfigMap.metadata.namespace=n)},null,8,["modelValue"])]),_:1}),a(C,{label:"数据"},{default:l(()=>[(_(!0),y(B,null,S(e.currentConfigMap.data,(n,d)=>(_(),y("div",{key:d},[a(g,{modelValue:e.currentConfigMap.data[d],"onUpdate:modelValue":k=>e.currentConfigMap.data[d]=k,placeholder:String(d)},null,8,["modelValue","onUpdate:modelValue","placeholder"])]))),128))]),_:1})]),_:1},8,["model"])]),_:1},8,["title","modelValue"]),a(r,{type:"success",onClick:e.handleAdd},{default:l(()=>[v("新增ConfigMap")]),_:1},8,["onClick"])])}const R=U(E,[["render",A],["__scopeId","data-v-c99c3951"]]);export{R as default};