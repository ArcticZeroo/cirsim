import {Component} from '../Component';

/**
 * Component: Circuit Reference

 * @constructor
 */
export const CircuitRef = function(paletteItem) {
    Component.call(this);

    this.height = 160;
    this.width = 80;

    // Name of the circuit this refers to (tab)
    this.circuitName = paletteItem !== undefined ? paletteItem.circuit : undefined;
    this.circuitRef = null;

    this.circuitIns = [];
    this.circuitOuts = [];
};

CircuitRef.prototype.setImg = function(imgObj) {
	var circuit = imgObj.componentCircuit;
	if(circuit !== undefined) {
		this.circuitName = circuit.name;
		this.circuitRef = null;
	}
}

CircuitRef.prototype = Object.create(Component.prototype);
CircuitRef.prototype.constructor = CircuitRef;

CircuitRef.type = "CircuitRef";            ///< Name to use in files
CircuitRef.label = "REF";           ///< Label for the palette
CircuitRef.desc = "Circuit Component";       ///< Description for the palette
CircuitRef.img = "circuitref.png";         ///< Image to use for the palette
CircuitRef.order = 99;               ///< Order of presentation in the palette
CircuitRef.description = '<h2>Circuit Component</h2><p>A Circuit Component uses another' +
    'Cirsim circuit as a component in the current circuit</p>';

/**
 * Compute the gate result
 * @param state
 */
CircuitRef.prototype.compute = function(state) {
    this.getCircuitRef();

    for(var i=0; i<this.ins.length && i<this.circuitIns.length; i++) {
        this.circuitIns[i].set(state[i]);
    }

    for(i=0; i<this.outs.length && i<this.circuitOuts.length; i++) {
        this.outs[i].set(this.circuitOuts[i].get());
    }
};

/**
 * Advance the animation for this component by delta seconds
 * @param delta Time to advance in seconds
 * @returns true if animation needs to be redrawn
 */
CircuitRef.prototype.advance = function(delta) {
    for(var i=0; i<this.ins.length && i < this.circuitIns.length; i++) {
        this.circuitIns[i].set(this.ins[i].get());
    }

    if(this.circuitRef !== null) {
        this.circuitRef.advance(delta);
    }

    for(var i=0; i<this.outs.length && i < this.circuitOuts.length; i++) {
        this.outs[i].set(this.circuitOuts[i].get());
    }

    return true;
};



CircuitRef.prototype.getCircuitRef = function() {
    if (this.circuitRef !== null) {
        return this.circuitRef;
    }

    this.circuitRef = this.circuit.circuits.getCircuit(this.circuitName).copy_clone();

    this.circuitRef.circuits = this.circuit.circuits;
    this.circuitRef.pending();

    this.ensureIO();
    return this.circuitRef;
}

CircuitRef.prototype.newTab = function() {
    this.circuitRef = null;
    this.circuitIns = [];
    this.circuitOuts = [];
};


CircuitRef.prototype.ensureIO = function() {
    var circuit = this.circuitRef;
    if(circuit !== null) {
        //
        // Fix inputs
        //

        // Find all input pins in the tab circuit
        const ins = circuit.getComponentsByType("InPin");
        const insb = circuit.getComponentsByType("InPinBus");
        for(const pin of insb) {
	        ins.push(pin);
        }

        //
        // If this is the first time this circuit
        // has been used, force all inputs to undefined
        // to ensure they get set from this circuit
        //
        if(this.circuitIns.length === 0) {
            for(let i=0; i<ins.length; i++) {
                ins[i].set(undefined);
            }
        }
        this.circuitIns = ins;

        // Find output pins in the tab circuit
        const outs = circuit.getComponentsByType("OutPin");
        const outsb = circuit.getComponentsByType("OutPinBus");
        for(const pin of outsb) {
	        outs.push(pin);
        }

        this.circuitOuts = outs;

        //
        // Determine if the settings are already correct.
        //
        if(ins.length === this.ins.length && outs.length === this.outs.length) {
            let bad = false;

            // Check the inputs
	        let i = 0;
	        for( ; i<ins.length; i++) {
	            if(this.ins[i].name !== ins[i].naming ||
                    this.ins[i].bus !== (ins[i].constructor.type === 'InPinBus')) {
	                bad = true;
	                break;
                }
	        }

	        for(i=0; i<outs.length; i++) {
		        if(this.outs[i].name !== outs[i].naming ||
			        this.outs[i].bus !== (outs[i].constructor.type === 'OutPinBus')) {
			        bad = true;
			        break;
		        }
	        }

	        // If it ain't broke, don't fix it.
	        if(!bad) {
	            return;
            }
        }

        //
        // Determine the size we need to draw the component
        //
        const maxIO = ins.length > outs.length ? ins.length : outs.length;

        this.height = maxIO * 16 + 32;
        if(this.height < 50) {
            this.height = 50;
        }

        let x = this.width / 2;

        let startY = - this.height / 2 + 8;

        // Save off the existing inputs by name
        const savedInputs = {};
        for(const pin of this.ins) {
            savedInputs[pin.name] = pin;
        }

        this.ins = [];

        let i = 0;
        for(i=0; i<ins.length; i++) {
            if(savedInputs[ins[i].naming] !== undefined) {
                this.ins.push(savedInputs[ins[i].naming]);

	            this.ins[i].name = ins[i].naming;
	            this.ins[i].x = -x;
	            this.ins[i].y = startY + i * 16;
	            this.ins[i].len = 16;
	            this.ins[i].bus = ins[i].constructor.type === 'InPinBus';
            } else {
	            this.addIn(-x, startY + i * 16, 16, ins[i].naming)
		            .bus = ins[i].constructor.type === 'InPinBus';
            }
        }


        // // let i = 0;
        // for( ; i<ins.length; i++) {
        //     if(i >= this.ins.length) {
        //         break;
        //     }
        //
        //     this.ins[i].name = ins[i].naming;
        //     this.ins[i].x = -x;
        //     this.ins[i].y = startY + i * 16;
        //     this.ins[i].len = 16;
        //     this.ins[i].bus = ins[i].constructor.type === 'InPinBus';
        // }
        //
        // // Add any new pins
        // for(; i<ins.length; i++) {
        //     this.addIn(-x, startY + i * 16, 16, ins[i].naming)
        //         .bus = ins[i].constructor.type === 'InPinBus';
        // }
        //
        // // Delete pins that have ceased to exist
        // if(i < this.ins.length) {
        //     for( ; i<this.ins.length; i++) {
        //         this.ins[i].clear();
        //     }
        //
        //     this.ins.splice(ins.length);
        // }

        //
        // Fix outputs
        //

        // Save off existing outputs by name
	    const savedOutputs = {};
	    for(const pin of this.outs) {
		    savedOutputs[pin.name] = pin;
	    }

	    this.outs = [];

	    for(i=0; i<outs.length; i++) {
		    if(savedInputs[outs[i].naming] !== undefined) {
			    this.ins.push(savedOutputs[outs[i].naming]);

			    this.outs[i].name = outs[i].naming;
			    this.outs[i].x = x;
			    this.outs[i].y = startY + i * 16;
			    this.outs[i].len = 16;
			    this.outs[i].bus = outs[i].constructor.type === 'OutPinBus';
		    } else {
			    this.addOut(x, startY + i * 16, 16, outs[i].naming)
				    .bus = outs[i].constructor.type === 'OutPinBus';
		    }
	    }

        // for(i=0; i<outs.length; i++) {
        //     if(i >= this.outs.length) {
        //         break;
        //     }
        //
        //     this.outs[i].name = outs[i].naming;
        //     this.outs[i].x = x;
        //     this.outs[i].y = startY + i * 16;
        //     this.outs[i].len = 16;
        //     this.outs[i].bus = outs[i].constructor.type === 'OutPinBus';
        // }
        //
        // // Add any new pins
        // for(; i<outs.length; i++) {
        //     this.addOut(x, startY + i * 16, 16, outs[i].naming)
        //         .bus = outs[i].constructor.type === 'OutPinBus';
        // }
        //
        // // Delete pins that have ceased to exist
        // if(i < this.outs.length) {
        //     for( ; i<this.outs.length; i++) {
        //         this.outs[i].clear();
        //     }
        //
        //     this.outs.splice(outs.length);
        // }

    }

}

/**
 * Clone this component object.
 * @returns {CircuitRef}
 */
CircuitRef.prototype.clone = function() {
    const copy = new CircuitRef();

    copy.circuitName = this.circuitName;
    for(let i=0; i<this.ins.length; i++) {
        copy.addIn(-32, i * 16, 16, this.ins[i].name);
    }


    for(let i=0; i<this.outs.length; i++) {
        copy.addOut(-32, i * 16, 16, this.outs[i].name);
    }

    copy.copyFrom(this);

    return copy;
};


/**
 * Load this object from an object converted from JSON
 * @param obj Object from JSON
 */
CircuitRef.prototype.load = function(obj) {
    this.circuitName = obj["circuitName"];
    Component.prototype.load.call(this, obj);
};


/**
 * Create a save object suitable for conversion to JSON for export.
 * @returns {*}
 */
CircuitRef.prototype.save = function() {
    var obj = Component.prototype.save.call(this);
    obj.circuitName = this.circuitName;
    return obj;
};


/**
 * Draw component object.
 * @param context Display context
 * @param view View object
 */
CircuitRef.prototype.draw = function(context, view) {
    this.getCircuitRef();
    this.ensureIO();
    
    this.selectStyle(context, view);

    var leftX = this.x - this.width/2 - 0.5;
    var rightX = this.x + this.width/2 + 0.5;
    var topY = this.y - this.height/2 - 0.5;
    var botY = this.y + this.height/2 + 0.5;

    context.beginPath();
    context.rect(leftX, topY, this.width, this.height);
    context.stroke();

    // Name

    context.font = "14px Times";
    context.textAlign = "center";
    if(this.naming !== null) {
        context.fillText(this.naming, this.x, this.y - 10);
    }

    context.fillText(this.circuitName, this.x, this.y + this.height/2 - 5);
    context.stroke();


    this.drawIO(context, view);
};
