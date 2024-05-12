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
    Object.keys(data).forEach((key) => defineProperty(data, key, data[key]), dep);
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
      //订阅者，使用到响应式的位置，也就是Watcher 
       dep.addSub()
    },
    set(newVal) {//数据更新时触发
      if(value===newVal)return
      // 通知所有使用该响应式 数据的观察者更新
      value = newVal;
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
    new Observer(data);
    // 3：视图解析
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
      set(newVal) {
        data[key] = newVal;
      },
    });
  });
}
