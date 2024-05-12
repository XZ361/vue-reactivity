class Vue {
  constructor(options){
    this.$options = options || {};
    this.$data = options.data || {};
    const el = options.el;
    this.$el = typeof el === 'string' ? document.querySelector(el) : el;
    
    // 1:劫持属性，将属性注入到Vue实例
    proxy(this,this.$data)

    
    // 2:创建Observer，监控data属性的变化

    // 3：视图解析
  }
}
function proxy(target,data){
  Object.keys(data).forEach(key=>{
    Object.defineProperty(target,key,{
       enumerable: true,
       configurable:true,
       get (){
        return data[key];
       },
       set(newVal){
        data[key] = newVal;
       }
    })
  })
   
}