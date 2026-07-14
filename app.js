const dialog=document.querySelector('#eventDialog');
document.querySelector('#newEvent').addEventListener('click',()=>dialog.showModal());
document.querySelector('#extract').addEventListener('click',(event)=>{event.preventDefault();dialog.close();const toast=document.querySelector('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)});
const sidebar=document.querySelector('.sidebar');
document.querySelector('.mobile-menu').addEventListener('click',()=>sidebar.classList.toggle('open'));
document.addEventListener('click',(e)=>{if(innerWidth<=760&&!sidebar.contains(e.target)&&!e.target.closest('.mobile-menu'))sidebar.classList.remove('open')});
