import React,{Component} from 'react'
import './App.css'
import './gm.css'
import SocketIoClient from 'socket.io-client'

import './materialize/css/materialize.min.css'
import M from  'materialize-css'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom"
const host = (window.android && window.android.ipAddress) || (window.location.protocol + "//" +window.location.hostname) 
const url =  host + ':4000'
const socket = SocketIoClient(url)
window.document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal')
    var instances = M.Modal.init(elems)
  })

let dados ={
	mesa:null,
	categoria:null,
	produtos:[],
	garcon:(window.android && window.android.getUser()) || window.localStorage.getItem('user'),
	total:0,
	data:Date.now(),
	status:0,
	display:'block'
}
function setDados(){
	dados ={
		mesa:null,
		categoria:null,
		produtos:[],
		garcon:(window.android && window.android.getUser()) || window.localStorage.getItem('user'),
		total:0,
		data:Date.now(),
		status:0,
		display:'block'
	}
}
function reload(comp){
	comp.setState({cancelar:(<div className="card horizontal">
		<div className="card-content" >
		Se você sair desta tela seu pedido não será concluído. Sair mesmo assim?<br/>
		<button onClick={()=> { 
			window.history.back();setDados()}
		} className="btn green"> Sim </button>
		<button className="btn red" onClick={() => comp.setState({cancelar:''})}> Não </button>
		</div>
		</div>)})
}
window.goback = (comp)=>{
	if(window.location.href === host +':4000/mobile/categorias'){
		reload(comp)
	}else{
		window.history.back()
	}
}

async function inserirPedido(){
	let {mesa,garcon,data,status,total,produtos} = dados
		let req = await fetch(url + '/insert/pedidos',{
			method:'POST',
			headers:{
				'Content-Type':'application/json',
				'Accept':'aplication/json'
			},
			body:JSON.stringify({mesa,garcon,data,status,total,produtos:JSON.stringify(produtos)})
		})
		let res = await req.json()
		console.log(res)
		socket.emit("newPedido")
}

class App extends Component{
  constructor(props){
  	super(props)
  	this.state = {
  		display:dados.display,
  		pedido_pronto:null
  	}
 }
 componentDidMount(){
 	socket.on("novo_pedido",async (data)=> {
 		let req = await fetch(url+'/select/pedidos/id_pedido/'+data.id_pedido)
 		let res = (await req.json())[0]
 		let garcon = res.garcon
 		if(res.status === 1){
 			window.android.notification("preparado pedido!","Pedido n° "+res.id_pedido +" está sendo preparado!")
 		} 
 		if(res.status === 2){
 			window.android.notification("Pedido pronto!"," Pedido nº "+res.id_pedido + " está pronto") 
 		}
 		 		
  	})
 }
 _hide(){
		dados.display = dados.display === 'block'?'none':'block'
		this.setState({display:dados.display})
	}
	style = {
		footer:{
			position:'absolute',
			bottom:10,
			left:0,
			textAlign:'center',
			width:'100%',
			color:'black',
			fontWeight:'bold',
		}
	}
  render(){
  return (
    <div className="App">
      <Router>
      <Link to="/mobile/pedidos" > {this.state.pedido_pronto}  </Link>
      	<Switch>
      		<Route path="/mobile" exact={true}  render={()=><Mesas />} />
      		<Route path="/mobile/categorias" exact={true} render={()=><Categorias mesa={dados.mesa}/>}/>
      		<Route path="/mobile/categorias/produtos" render={()=><Produtos categoria={dados.categoria} />} />
      		<Route path="/mobile/pedidos" component={Pedidos} />
      	</Switch>
      	<Route path="/mobile/categorias" render={()=> (<div> 
      		<footer  style={this.style.footer}>
				<div style={{display:this.state.display}} >
				<table className="card" style={{backgroundColor:'white'}}>
				<thead><tr><th>Produto</th> <th>Valor</th> <th>Quantidade</th></tr></thead>
				<tbody>	{dados.produtos.map((produto)=>{
					return (<tr key={produto.id_produto}>
						<td>{produto.nome}</td> <td> R$ {produto.preco.toFixed(2)}</td> <td>{produto.quantidade} </td>
					</tr>)
				})}
				</tbody>
				</table>
				Total : R$ {dados.total.toFixed(2)}<br/>
				<button className="btn blue waves-effect waves-light" onClick={inserirPedido}>Confirmar  
					<i className="material-icons right" >send</i>
				</button> 
				<button className="btn red waves-effect waves-light" onClick={inserirPedido}>Cancelar  
					<i className="material-icons right">cancel</i>
				</button>
				</div>
				<button style={{width:'90%'}} className="btn green" onClick={this._hide.bind(this)} >
				 {this.state.display == 'block' ? (<i className="material-icons">expand_more</i>) : (<i className="material-icons">expand_less</i>)}</button>
				
				</footer>
      	</div>)} />
      </Router>
    </div>
  )
}
}
class Pedidos extends Component{
	constructor(props){
		super(props)
		this.state = {
			pedidos:null
		}
	}
	async componentDidMount(){
		let req = await fetch(url + '/select/pedidos/garcon/'+dados.garcon)
		let res = await req.json()
		var pedidos = []
		for(let pedido of res){
			var prod = JSON.parse(pedido.produtos).reverse()
			let ap = []
			for(let p of prod){
				ap.push((<div>
						({p.quantidade}) <strong>{p.nome}</strong>
					</div>))
			}
			var spedido = <Card key={pedido.id_pedido} title={pedido.mesa} data={ap} status={pedido.status} total={pedido.total} id={pedido.id_pedido}/>
			pedidos.push(spedido)
		}
		pedidos = pedidos.reverse()
		this.setState({pedidos})
	}
	render(){
		return (
			<div>
			{this.state.pedidos}
			</div>
			)
	}
}

class Categorias extends Component{
	constructor(props){
		super(props)
		this.state = {
			mesa:this.props.mesa,
			categorias:null,
			display:dados.display,
			cancelar:''		}
	}
	async componentDidMount(){
		let req = await fetch(url + '/database/categorias')
		let res = await req.json()
		var categorias = []
		for(let categoria of res){
			var scategoria = (<div onClick={()=>dados.categoria=categoria.nome}  key={categoria.id_categoria}> 
			<Link className="card" style={{fontSize:'18px'}} to="/mobile/categorias/produtos" >{categoria.nome} </Link>
			</div>)
			categorias.push(scategoria)
		}
		this.setState({categorias})
	}
	
	render(){
		return (
			<div>
				<Button cancelar={this}/>
				{this.state.cancelar}
				<h3>{this.state.mesa} </h3>
				{this.state.categorias}
				
			</div>
		)
	}
}

class Mesas extends Component{
	constructor(props){
		super(props)
		this.state = {mesas:null,num_pedidos:0}
	}
	async componentDidMount(){
		let req2 = await fetch(url + '/database/mesas')
		let res2 = await req2.json()
		
		var mesas = []
		for(let mesa of res2){
			var smesa = (<div onClick={()=>dados.mesa=mesa.nome} className="hand" key={mesa.id_mesa} value={mesa.nome}> 
			<Link className="card" style={{fontSize:'18px'}} to="/mobile/categorias"> {mesa.nome} </Link> 
			</div>)
			mesas.push(smesa)
		}
		this.setState({mesas})
	 	socket.on("reload",(data)=>this.setState({num_pedidos:this.state.num_pedidos + 1}))

	}
	render(){
		return (
			<div >
				<center><h3> Maresias </h3></center>
				{this.state.cancelar}
				{this.state.mesas}
				<footer style={{fontSize:'32px',position:'absolute',bottom:10,left:0,textAlign:'center',width:'100%'}}>
					<Link  to="/mobile/pedidos" > Pedidos {this.state.num_pedidos}</Link>
				</footer>
			</div>
		)
	}
}

class Produtos extends Component{
	constructor(props){
		super(props)
		this.state = {
			categoria:this.props.categoria,
			produtos:null

		}
	}
	_insert(produto){
		let is_p = false
		for(let p of dados.produtos){
			if(p.id_produto === produto.id_produto){
				is_p = true
				p.quantidade += 1
				p.total += p.preco
				break
			}
		}
		if(!is_p){
			produto.quantidade = 1
			dados.produtos.push(produto)
			dados.total += produto.preco
		}
		M.toast({displayLength:1000,inDuration:100,outDuration:100,html: produto.quantidade + ' ' +produto.nome + " adicionado !"})
	}
	async componentDidMount(){
		const categoria = this.state.categoria
		let req = await fetch(url + '/select/produtos/categoria/'+categoria)
		let res = await req.json()
		var produtos = []
		for(let produto of res){
			var sproduto = (<div className="card" onClick={()=>this._insert(produto)} key={produto.id_produto}>
			 <div className="card-content"> 
			 	<div className="card-action" > <i className="material-icons left" >add</i> {produto.nome} R$ {produto.preco.toFixed(2)} </div>
			 </div>
			 </div>)
			produtos.push(sproduto)
		}
		this.setState({produtos})
	}
	render(){
		return (<div>
		<Button/>
			<h3> {this.state.categoria}</h3>
			{this.state.produtos}
			
		</div>)
	}
}

class Button extends Component{
	render(){
		return (<button className="btn-floating btn-large waves-effect waves-light blue" onClick={window.goback.bind(this,this.props.cancelar)}>
		<i className="material-icons">arrow_back</i>
		</button>)
	}
}
class Card extends Component{
	constructor(props){
		super(props)
		this.state = {
			status:this.props.status,
			aquivado:'block',
			socket:this.props.socket
		}
	}
	async _preparar(status,id_pedido){
		let req = await fetch(url + "/edit/pedidos",{
			method:"POST",
			headers:{"Content-Type":"application/json"},
		body:JSON.stringify({coluna1:"id_pedido",value1:id_pedido,coluna2:"status",value2:status})
		})
		let res = await req.json()
		this.setState({status})
	}
	render(){
		var colors = ["green","blue","black"]
		var status = ["recebido","preparando","pronto"]
		return (
			 <div className="row" style={{display:this.state.arquivado}}>
			    {this.state.status !== 4 && (<div className="col s12 m6">
			      <div className={"card "+colors[this.state.status]+ " darken-1"}>
			        <div className="card-content white-text">
			          <span className="card-title">{this.props.title} <span className="">Pedido n° {this.props.id}</span></span>
			          <div>
			          	{this.props.data}
			          	{status[this.state.status]}<br/>
					Total : {this.props.total}
			          </div>
			        </div>
			        <div className="card-action">

			          <button className="btn red">Cancelar</button>
				  {this.state.status === 2 && <button className="btn grey" onClick={this._preparar.bind(this,4)}> Arquivar </button>}

			        </div>
			      </div>
			    </div>)}
  			</div>

		)
	}
}

export default App
