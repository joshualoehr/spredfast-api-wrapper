var OptionError = require('../../lib/api/errors.js').OptionError,
    util = require('../../lib/api/util.js');

beforeAll(function() {
    var self = this;
    this.setAndCheck = function(obj, prop, correct, fn) {
        correct = correct.split('||');
        var testVals = [undefined,null,1234,true,'string',{},function(){},
            [],[1234],[true],['string'],[{}],[function(){}],[1234,'string',true]];
        var endVals = [], arr = testVals.slice();
        testVals.forEach(function(val) {
            if (correct.indexOf(util.getType(val)) !== -1) {
                endVals.push(val);
                arr.splice(arr.indexOf(val), 1);
            }
        });

        var desc = {
            configurable: true,
            enumerable: true
        }

        arr.forEach(function(el) {
            desc.value = el;
            Object.defineProperty(obj, prop, desc);
            expect(fn).toThrowError(TypeError, new RegExp(prop));
        });

        endVals.forEach(function(el) {
            desc.value = el;
            Object.defineProperty(obj, prop, desc);
            expect(fn).not.toThrowError(TypeError, new RegExp(prop));
        });
    }

    this.validateOptions = function(required, options, testOptions, fn) {
        required.forEach(function(req, i, arr) {
            options[req] = testOptions[req];
            if (i < arr.length - 1) {
                expect(fn).toThrowError(OptionError);
            }
        });
    }

    this.stringify = function(obj) {
        var json = '';
        Object.keys(obj).forEach(function(key) {
            try {
                json += JSON.stringify(key);
            } catch (e) {
                if (e instanceof TypeError) {
                    json += '[Circular]';
                } else {
                    throw e;
                }
            } finally {
                json += '\n';
            }
        });
        return json;
    }
});
