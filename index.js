class Watcher{
  constructor(vm,key,callback){
    this.vm = vm;
    this.key = key;
    this.callback = callback;

    // 每次只能操作一个watcher
    Dep.target = this;
    this.oldValue = vm[key];
    Dep.target = null;
  }
  //  当前，Watcher如何被记录 
  update(){
    const newValue = this.vm[this.key];
    if(newValue===this.oldValue)return
    this.callback(newValue)
    this.oldValue = newValue  
  }
}
class Compile{
  // 视图模版的解析
  // 解析视图中内容的结构，哪里使用了哪些文本、属性 ，判断里面是否有插值表达式、指令、，找到其中使用的响应式数据
  // 将其中的响应式数据所对应的名称提取出来做一个标记，即为该位置创建一个观察者Watcher
  // Watcher最终关联到某一个Observer里面，就可以实现数据的响应式 
  constructor(vm){
    this.vm =vm; 
    this.el = vm.$el;
    this.compile(this.el)
  }
  // 模版的编译操作，需要作文本和元素的处理
  // 文本处理对应插值表达式的操作，元素处理对应指令的操作
  compile(el){
    // 获取当前dom所有子节点
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node=> {
      // node代表不同的节点形式，常见值为1,2,3
      // 1-元素节点，2-属性节点，3-文本节点
      if(node.nodeType ===3){//文本节点，意味着我们需要进行插值表达式的处理
        //用于进行文本解析
        this.compileText(node)
      }else if(node.nodeType===1){//元素节点

      }
      // 当前节点内部，可能还有子节 点
      if(node.childNodes && node.childNodes.length){
        // 递归处理子节点
        this.compile(node)
      }
    })
  }
  compileText(node ){
    // 正则匹配文本,匹配大括号中的任意文本，?表示惰性匹配，找到第一个就OK
    const reg = /\{\{(.+?)\}\}/g
    // 去掉换行，和空格
    const value = node.textContent.replace(/\s/g,'')
    const tokens = [];

    let result,index,lastIndex=0
    while(result = reg.exec(value)){
      index=result.index
      if(index>lastIndex){
        // 找到匹配的值
        tokens.push(value.slice(lastIndex,index))
      }
      const key  = result[1].trim();
      tokens.push(this.vm[key])

      lastIndex=index+result[0].length
      // 更新操作
      const pos = tokens.length-1
      
      new Watcher(this.vm,key,newValue=>{
         tokens[pos] = newValue;
         node.textContent = tokens.join('');
      })
    }
    if(lastIndex<value.length){
      tokens.push(value.slice(lastIndex))
    }
    if(tokens.length){
      node.textContent = tokens.join('')
    }
  }
}
class Dep{
  constructor(){
    // 订阅列表，保存订阅者，即视图中所有使用到该响应式数据的区域
    this.subs=[];
  }
  addSub(sub){
    //sub到底是神魔？ 
    // 添加订阅者
    this.subs.push(sub)
  }
  notify(){
    // 通知订阅者更新
    this.subs.forEach(sub=>sub.update())
  }
}
class Observer {
  constructor(data) {
    this.data = data;
    // dep记录了使用到当前响应式数据的所有区域
    // 当Obsever观察到数据更新，就会告知dep,dep会通知使用到当前响应式数据的所有区域进行更新
    this.dep = new Dep();
    // 对data中的属性进行遍历
    this.walk(data);
  }
  walk(data) {
    const dep = this.dep;
    Object.keys(data).forEach(key => defineProperty(data, key, data[key],dep));
  }
}
function defineProperty(data, key, value, dep) {
  if (typeof value === "object" && value !== null) {
    // 如果当前对象是嵌套对象，则使用递归调用
    return new Observer(value);
  }
  // 如果是普通的值，则需要对相关数据做属性定义
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {//getter会在视图中读取时进行触发，添加响应式数据在视图中的位置
      // 添加观察者，
      //订阅者，使用到响应式的位置，也就是Watcher ,创建Watcher，泽贤要进行视图模版的解析
      Dep.target && dep.addSub(Dep.target)
      return value
    },
    set(newValue) {//数据更新时触发
      if(value===newValue)return
      // 通知所有使用该响应式 数据的观察者更新
      value = newValue;
      if(typeof value==='object' && value!==null){
        return new Observer(value);
      }
      dep.notify();
    },
  });
}
class Vue {
  constructor(options) {
    this.$options = options || {};
    this.$data = options.data || {};
    const el = options.el;
    this.$el = typeof el === "string" ? document.querySelector(el) : el;

    // 1:劫持属性，将属性注入到Vue实例
    proxy(this, this.$data);

    // 2:创建Observer，监控data属性的变化
    new Observer(this.$data);
    // 3：视图解析
    new Compile(this)
  }
}
function proxy(target, data) {
  Object.keys(data).forEach((key) => {
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get() {
        return data[key];
      },
      set(newValue) {
        data[key] = newValue;
      },
    });
  });
}
