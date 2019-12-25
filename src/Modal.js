import React,{Component} from 'react'
export default class Modal extends Component{
render(){
	return (
		 <div>
			<a className="waves-effect waves-light btn modal-trigger" href="#modal1">Modal</a>

			  <div id="modal1" className="modal">
				<div className="modal-content">
				  <h4>{this.props.title}</h4>
				  <p>{this.props.data}</p>
				</div>
				<div className="modal-footer">
				  <a href="#!" className="modal-close waves-effect waves-green btn-flat">Fechar</a>
				</div>
			  </div>
		 </div>
	)
}
}