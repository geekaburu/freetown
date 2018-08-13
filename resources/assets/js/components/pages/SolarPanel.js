import React, { Component } from 'react'
import ReactSpeedometer from 'react-d3-speedometer'
import { withRouter } from 'react-router-dom'

import { chartData } from '../../resources/ChartHelper'
import Card from '../layouts/Card'
import Chart from '../layouts/Chart'
import RangeSlider from '../layouts/RangeSlider'
import Map from '../layouts/Map'
import DataTable from '../layouts/DataTable'
import ConditionMeter from '../layouts/ConditionMeter'
import Loader from '../layouts/Loader';
import Alert from '../layouts/Alert'

class SolarPanel extends Component {
	constructor(props) {
        super(props)
        this.state = {
            loader:'',
            alert:{ display:false, type:'', title:'' ,body:'' },
            location:'',
            conditions:'',
            controls:'',
            chart: { datasets:[], labels:[], filter:'today' },
            panels: '',
            angle: '',
        }
        this.handleRangeIncrease = this.handleRangeIncrease.bind(this)
        this.handleRadioChange = this.handleRadioChange.bind(this)
        this.handleModeUpdate = this.handleModeUpdate.bind(this)
        this.handleRuntimeChange = this.handleRuntimeChange.bind(this)
        this.handleModalDismiss = this.handleModalDismiss.bind(this)
        this.handleFilterValue = this.handleFilterValue.bind(this)
        this.fetchData = this.fetchData.bind(this)
    }

	// Get data when the component loads
    componentDidMount(){
    	this.fetchData()      	
    }

	// Tear down the interval 
    componentWillUnmount() {
	    //clearInterval(this.timerID);
	}	

	fetchData(){
		this.setState({
			loader:true,
		}, ()=>{
			axios.post('api/customers/panel-data', {
	      		chart_filter: this.state.chart.filter,	
	    	})
	    	.then((response) => {
	    		const data = response.data
	    		var table = {
	    			data: data.panels.data,
	    			columns: [
						{ title: 'Panel ID', data: 'panel_id' },
	            		{ title: 'Energy (Kwh)', data: 'energy' },
	            		{ title: 'User', data: 'user_id' },
	            		{ title: 'Credits Earned', data: 'credits' },
	            		{ title: 'Amount Earned', data: 'amount' },
	    			]
	    		}
	    		this.setState({
					location: data.location,
					conditions: data.conditions,
					controls: data.controls,
					chart: chartData(data.chart.data, ['energy']),
					panels: table,
					loader:false,
					angle: data.controls.angle,
				})
	    	})
	    	.catch((error) => {
	    		if(User.hasTokenHasExpired(error.response.data)){
	    			this.props.history.push('/login')
	    		}
	    	})
		})
	}

	handleFilterValue(value){
		this.setState({
			chart:{
				datasets:this.state.chart.datasets, 
				labels:this.state.chart.labels, 
				filter: value 
			}
		}, ()=>{
			this.fetchData()
		})
	}
	
	// When the radio buttons that control the mode are changed
    handleRadioChange(event){
    	const mode = event.target.value
	    this.setState({
	        controls : {
	        	mode: mode,
	        	runtime:this.state.controls.runtime,
	        	angle: mode=='manual' ? this.state.controls.angle : this.state.angle,
	        }
	    })
    }

    // handle what happens when the run time field is updated. 
	handleRuntimeChange(event){
		this.setState({
	        controls : {
	        	mode: this.state.controls.mode,
	        	runtime:event.target.value,
	        	angle: this.state.controls.angle,
	        }
	    })
	}
	
	// handle the change of the panel controls
    handleModeUpdate(){
    	this.setState({loader:true})
    	axios.post('api/customers/update-controls', {	
    		mode:this.state.controls.mode,
    		runtime:this.state.controls.runtime,
    		angle:this.state.controls.angle,
    	})
    	.then((response) => {
    		this.setState({
    			loader:false,
    			alert:{display:true,type:'success',title:'Success',body:response.data.message},
    		})
    	})
    	.catch((error) => {
    		this.setState({loader:false})
    		if(User.hasTokenHasExpired(error.response.data)){
    			this.props.history.push('/login')
    		}
    	})    		
    }
	
	// Handle the increase of the range modal control component
	handleRangeIncrease(data){
		this.setState({
			controls: {
				mode:this.state.controls.mode,
				runtime:this.state.controls.runtime,
				angle:parseInt(data)
			}
		})
	}

	// Handle the dismiss of the alert modal
	handleModalDismiss(state){
    	if(state){
    		this.setState({
    			alert:{display:false,type:'',title:'',body:''}
    		})
    	}
    }

    render() {
    	const data = [{
            "name": "Alvin Kaburu",
            "email": "geekaburu@amprest.co.ke",
            "phone_number": "727467877",
            "energy": 109.77,
            "panels": 10,
            "location": {
                "latitude": -1.2953709,
                "longitude": 36.8841522,
                "town": "Langata",
                "county": "Kericho"
            }
        }]
    	const map = (
			<Map 
				defaultCenter={ {lat: -1.2953709, lng: 36.8841522} } 
				defaultZoom={ 17 }
				mapTypeId='hybrid'
				contentWidth='100%'
				contentHeight='300px'				
				markers={data}
			/>
    	)

    	// Creating the condition meter
    	const conditions = (
    		<ConditionMeter 
    			containerHeight={300} 
    			barHeight={250}
    			temperature={this.state.conditions.temperature}
    			humidity={this.state.conditions.humidity}
    			intensity={this.state.conditions.intensity}
    		/>    	
    	)

    	// Creating the mode control section
		const mode = (
			<div style={{height:'450px'}} className="row text-center justify-content-center py-4">				
				<div className="col-12 mb-3">
					<div onChange={this.handleRadioChange}>						
						<span className="mx-2"><input type="radio" value="search" name="mode" checked={this.state.controls.mode == 'search' ? true : false} /> Seach</span> 						
						<span className="mx-2"><input type="radio" value="versatile" name="mode" checked={this.state.controls.mode == 'versatile' ? true : false} /> Versatile</span>						
						<span className="mx-2"><input type="radio" value="manual" name="mode" checked={this.state.controls.mode == 'manual' ? true : false} /> Manual</span>					
					</div>
				</div>
				<div className="col-12 col-md-8">
					<div className="w-100" style={{
					    height: '250px'
					}}>
						<ReactSpeedometer
							fluidWidth={true}
							maxValue={180}
						  	value={this.state.controls.angle}
						  	width={250}
						  	height={250}
						  	needleColor="red"
						  	segments={10}
						  	textColor="black"
						  	needleTransitionDuration={4000}
						  	needleTransition="easeElastic"
						  	currentValueText={`Position: ${this.state.controls.angle} Deg`}
						  	ringWidth={40}
						/>
					</div>
				</div>
				<div className="col-8 m-0">
					<RangeSlider disabled={this.state.controls.mode == 'manual' ? false : true} angle={this.state.controls.mode == 'manual' ? this.state.controls.angle : this.state.angle} min={0} max={180} rangeIncrease={this.handleRangeIncrease} />
					<div className="input-group my-3">
						<div className="input-group-prepend">
					    	<span className="input-group-text">Change Runtime in Minutes</span>
					  	</div>
					  	<input type="number" defaultValue={this.state.controls.runtime} onChange={this.handleRuntimeChange} className="form-control" />
					</div>
				</div>
				<div className="col-12">
					<button className="btn btn-success" onClick={this.handleModeUpdate}>
						Update Controls
					</button>
				</div>
			</div>
		)

		// Create a datatable
		const datatable = (
			<div className="row justify-content-center py-4 m-0">				
				<div className="col-12">
					{ this.state.panels.columns 
						? <DataTable 
							data={this.state.panels.data}
							columns={this.state.panels.columns}
							searching={false} 
							defs={[{
				                'render': function ( data, type, row ) {
				                    return parseFloat(data).toFixed(2);
				                },
					                'targets': [1,3,4]
					            },{
						            "targets": [ 2 ],
						            "visible": false,
						            "searchable": false
						        }
					        ]}
							sumColumns={[1,3,4]}
							withFooter={true} 
						/>
						: '' 
					}
				</div>
			</div>
		)
		// Create an instance of the chart component
        const chart = (
        	<div>
				<Chart
					data={ this.state.chart }
					height={ 324 }
					handleFilterValue={this.handleFilterValue}
					options = {{
						maintainAspectRatio: false,
						legend: {
				            display: true,
				            position: 'bottom',
				        },
						title: {
				            display: true,
				            text: 'A Graph of Energy Against Time'
				        },
				        scales: {
				            yAxes: [{
				            	scaleLabel: {
						        	display: true,
						        	labelString: 'Energy in Kwh',
						        	fontColor:'rgba(4, 33, 47, 1)',
						      	}
						    }],
						    xAxes: [{
				            	scaleLabel: {
						        	display: true,
						        	labelString: 'Time',
						        	fontColor:'rgba(4, 33, 47, 1)',
						      	}
						    }]
				        }
					}}
				/>        		
        	</div>
        )
    	return (
			<div id="solar-panel" className="row m-0">
				{/* Include loader and alert boxes */}
				<Loader load={this.state.loader} />  
				{ this.state.alert.display ? 
					(
    					<Alert backdrop ='static' keyboard={false} focus={true} show={true} title={this.state.alert.title} body={this.state.alert.body} type={this.state.alert.type} dismissModal={this.handleModalDismiss} />
		    		) : null
    			}  		
    			{/* Begining of the page */}
				<div className="col-12">
					<div className="row">
						<div className="col-12 col-lg-9 p-0 pr-lg-1 mt-1">
							<Card header="Location" body={map} />
						</div>
						<div className="col-12 col-lg-3 p-0 mt-1">
							<Card header="Environment" body={conditions}/>
						</div>
						<div className="col-12 mt-1">
							<div className="row">
								<div className="col-12 col-lg-6 p-0 pr-lg-1 mt-1">
									<Card header="Mode Control" body={mode} />
								</div>
								<div className="col-12 col-lg-6 p-0 mt-1">
									<Card header="Energy Collection" body={ chart }  />
								</div>
							</div>
						</div>
						<div id="panels" className="col-12 mt-1">
							<div className="row">
								<div className="col-12 p-0 mt-1">
									<Card header="Solar Panel Data this Month" body={ datatable }/>
								</div>
							</div>
						</div>
					</div>
				</div>
		    </div>
    	)
    }
}

export default withRouter(SolarPanel)