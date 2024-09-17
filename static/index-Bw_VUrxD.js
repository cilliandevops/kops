import{i as b,_ as S}from"./index-D604ZND0.js";import{b as f,B as U}from"./element-CaKE2_v0.js";import{m as _,r as m,f as F,c as k,ai as r,p as w,q as A,U as t,O as o,S as D}from"./vue-whfKlJIt.js";import"./vxe-HN9Qqgrb.js";const R=_({name:"Deployment",setup(){const e=m([]),a=m(1),v=m(10),d=m(!1),c=m("新增Deployment"),i=m({name:"",namespace:"default",replicas:1,deploymentSpec:{replicas:1,selector:{matchLabels:{app:"default"}},template:{metadata:{creationTimestamp:null,labels:{app:"default"}},spec:{containers:[{name:"container-name",image:"nginx:latest",terminationMessagePath:"/dev/termination-log",terminationMessagePolicy:"File",imagePullPolicy:"IfNotPresent"}],restartPolicy:"Always",terminationGracePeriodSeconds:30,dnsPolicy:"ClusterFirst",serviceAccountName:"default",serviceAccount:"default",securityContext:{},schedulerName:"default-scheduler"}},strategy:{type:"RollingUpdate",rollingUpdate:{maxUnavailable:"25%",maxSurge:"25%"}},revisionHistoryLimit:10,progressDeadlineSeconds:600},deploymentStatus:{observedGeneration:1,replicas:1,updatedReplicas:1,readyReplicas:1,availableReplicas:1,conditions:[]}}),u=F(()=>{const l=(a.value-1)*v.value,g=l+v.value;return e.value.slice(l,g)}),s=async()=>{try{const l=await b({url:"/apis/v1/k8s/deployments",method:"get",baseURL:"http://localhost:8080"});e.value=l}catch(l){console.error("获取Deployment数据失败:",l)}},h=l=>{a.value=l},C=()=>{c.value="新增Deployment",i.value={name:"",namespace:"default",replicas:1,deploymentSpec:{replicas:1,selector:{matchLabels:{app:"default"}},template:{metadata:{creationTimestamp:null,labels:{app:"default"}},spec:{containers:[{name:"container-name",image:"nginx:latest",terminationMessagePath:"/dev/termination-log",terminationMessagePolicy:"File",imagePullPolicy:"IfNotPresent"}],restartPolicy:"Always",terminationGracePeriodSeconds:30,dnsPolicy:"ClusterFirst",serviceAccountName:"default",serviceAccount:"default",securityContext:{},schedulerName:"default-scheduler"}},strategy:{type:"RollingUpdate",rollingUpdate:{maxUnavailable:"25%",maxSurge:"25%"}},revisionHistoryLimit:10,progressDeadlineSeconds:600},deploymentStatus:{observedGeneration:1,replicas:1,updatedReplicas:1,readyReplicas:1,availableReplicas:1,conditions:[]}},d.value=!0},y=l=>{c.value="编辑Deployment",i.value=JSON.parse(JSON.stringify(l)),d.value=!0},p=async()=>{try{c.value==="新增Deployment"?(await b({url:"/apis/v1/k8s/deployments",method:"post",data:i.value,baseURL:"http://localhost:8080"}),f.success("Deployment新增成功")):(await b({url:`/apis/v1/k8s/deployments/${i.value.name}`,method:"put",data:i.value,baseURL:"http://localhost:8080"}),f.success("Deployment编辑成功")),d.value=!1,s()}catch(l){console.error("保存Deployment失败:",l),f.error("保存Deployment失败")}},P=l=>{U.confirm(`确定删除Deployment ${l.name} 吗？`,"提示",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"}).then(async()=>{try{await b({url:`/apis/v1/k8s/deployments/${l.name}`,method:"delete",baseURL:"http://localhost:8080"}),f.success("Deployment删除成功"),s()}catch(g){console.error("删除Deployment失败:",g),f.error("删除Deployment失败")}})};return k(()=>{s()}),{deploymentData:e,currentPage:a,pageSize:v,currentPageData:u,handlePageChange:h,dialogVisible:d,dialogTitle:c,currentDeployment:i,handleAdd:C,handleEdit:y,handleSave:p,handleDelete:P}}});function N(e,a,v,d,c,i){const u=r("el-table-column"),s=r("el-button"),h=r("el-table"),C=r("el-pagination"),y=r("el-input"),p=r("el-form-item"),P=r("el-input-number"),l=r("el-form"),g=r("el-dialog");return w(),A("div",null,[t(h,{data:e.currentPageData,border:"",stripe:"",style:{width:"100%"}},{default:o(()=>[t(u,{prop:"name",label:"Deployment名称",width:"180"}),t(u,{prop:"namespace",label:"命名空间",width:"180"}),t(u,{prop:"replicas",label:"副本数",width:"100"}),t(u,{prop:"deploymentSpec.template.spec.containers[0].image",label:"镜像",width:"300"}),t(u,{label:"操作",width:"200"},{default:o(({row:n})=>[t(s,{type:"primary",onClick:V=>e.handleEdit(n)},{default:o(()=>[D("编辑")]),_:2},1032,["onClick"]),t(s,{type:"danger",onClick:V=>e.handleDelete(n)},{default:o(()=>[D("删除")]),_:2},1032,["onClick"])]),_:1})]),_:1},8,["data"]),t(C,{currentPage:e.currentPage,"onUpdate:currentPage":a[0]||(a[0]=n=>e.currentPage=n),"page-size":e.pageSize,total:e.deploymentData.length,layout:"total, prev, pager, next, jumper",onCurrentChange:e.handlePageChange},null,8,["currentPage","page-size","total","onCurrentChange"]),t(g,{title:e.dialogTitle,modelValue:e.dialogVisible,"onUpdate:modelValue":a[6]||(a[6]=n=>e.dialogVisible=n)},{footer:o(()=>[t(s,{onClick:a[5]||(a[5]=n=>e.dialogVisible=!1)},{default:o(()=>[D("取消")]),_:1}),t(s,{type:"primary",onClick:e.handleSave},{default:o(()=>[D("保存")]),_:1},8,["onClick"])]),default:o(()=>[t(l,{model:e.currentDeployment,"label-width":"120px"},{default:o(()=>[t(p,{label:"Deployment名称"},{default:o(()=>[t(y,{modelValue:e.currentDeployment.name,"onUpdate:modelValue":a[1]||(a[1]=n=>e.currentDeployment.name=n)},null,8,["modelValue"])]),_:1}),t(p,{label:"命名空间"},{default:o(()=>[t(y,{modelValue:e.currentDeployment.namespace,"onUpdate:modelValue":a[2]||(a[2]=n=>e.currentDeployment.namespace=n)},null,8,["modelValue"])]),_:1}),t(p,{label:"副本数"},{default:o(()=>[t(P,{modelValue:e.currentDeployment.replicas,"onUpdate:modelValue":a[3]||(a[3]=n=>e.currentDeployment.replicas=n),min:1},null,8,["modelValue"])]),_:1}),t(p,{label:"镜像"},{default:o(()=>[t(y,{modelValue:e.currentDeployment.deploymentSpec.template.spec.containers[0].image,"onUpdate:modelValue":a[4]||(a[4]=n=>e.currentDeployment.deploymentSpec.template.spec.containers[0].image=n)},null,8,["modelValue"])]),_:1})]),_:1},8,["model"])]),_:1},8,["title","modelValue"]),t(s,{type:"success",onClick:e.handleAdd},{default:o(()=>[D("新增Deployment")]),_:1},8,["onClick"])])}const T=S(R,[["render",N],["__scopeId","data-v-3f7547bb"]]);export{T as default};
