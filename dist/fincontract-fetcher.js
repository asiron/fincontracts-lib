'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fincontract = require('./fincontract');

var finc = _interopRequireWildcard(_fincontract);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Fetcher class is used for fetching blockchain deployed Fincontracts, by
 * calling appropriate functions (see `getFincontractInfo` and
 * `getDescriptionInfo` from {@link FincontractMarketplace}). It recursively
 * traverses the deployed Fincontract and constructs it's copy for further
 * processing in memory.
 */
var Fetcher = function () {

  /**
   * Constructs the {@link Fetcher} object with Fincontracts smart contract
   * instance
   * @param {FincontractMarketplace} marketplace a Fincontracts smart contract instance
   */
  function Fetcher(marketplace) {
    _classCallCheck(this, Fetcher);

    /** @private */
    this.marketplace = marketplace;
  }

  /** @private */


  _createClass(Fetcher, [{
    key: 'pullFincontract',


    /**
     * Fetches Fincontract from blockchain given its 32-byte address, by
     * recursively fetching nodes and it's children and constructing the
     * {@link FincNode} description tree (see {@link Fetcher#pullDescription})
     * @param  {String} fctID - 32-byte address of a blockchain deployed Fincontract
     * @return {Fincontract} fetched Fincontract instance
     */
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(fctID) {
        var fctInfo, desc;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.getFincontractInfo(fctID);

              case 2:
                fctInfo = _context.sent;
                _context.next = 5;
                return this.pullDescription(fctInfo[3]);

              case 5:
                desc = _context.sent;
                return _context.abrupt('return', new finc.Fincontract({
                  id: fctID,
                  issuer: fctInfo[0],
                  owner: fctInfo[1],
                  proposedOwner: fctInfo[2],
                  rootDescription: desc
                }));

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function pullFincontract(_x) {
        return _ref.apply(this, arguments);
      }

      return pullFincontract;
    }()

    /**
     * Performs a recursive description fetch, given a root 32-byte address of the
     * blockchain deployed Fincontract description
     * @param  {String} descID - 32-byte address of a blockchain deployed
     *   Fincontract's description
     * @return {FincNode} fetched FincNode description tree
     */

  }, {
    key: 'pullDescription',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(descID) {
        var _this = this;

        var descInfo, primitive, childrenIds;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.getDescriptionInfo(descID);

              case 2:
                descInfo = _context2.sent;
                primitive = Fetcher.Primitives[descInfo[0]];
                childrenIds = descInfo.slice(2, 2 + primitive.childrenCount);

                childrenIds = childrenIds.map(function (id) {
                  return _this.pullDescription(id);
                });
                _context2.next = 8;
                return Promise.all(childrenIds);

              case 8:
                childrenIds = _context2.sent;
                return _context2.abrupt('return', this.constructNode(descInfo, childrenIds));

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function pullDescription(_x2) {
        return _ref2.apply(this, arguments);
      }

      return pullDescription;
    }()

    /**
     * Constructs a current {@link FincNode} given it's description, which
     * uniquely specifies the type of node to be constructed as well as its
     * already constructed sub-nodes (childrenIds) and returns the currentNode.
     * Due to lack of direct support for Timebound and Scale nodes by
     * {@link FincontractMarketplace}, they are inferred from the description.
     * <ul>
     *   <li>{@link FincScaleNode} - Scale node is constructed if description
     *   contains scale factor not equal to 1</li>
     *   <li>{@link FincTimeboundNode} - Timebound node is constructed if
     *   description contains lower bound not equal to 0</li>
     * </ul>
     * In both cases, nodes are constructed above the current node and the
     * top node is returned from the function
     * @param  {Array} descInfo - array containing description, as defined by
     *   `getDescriptionInfo` from {@link FincontractMarketplace}
     * @param  {Array} childrenIds - array containing {@link FincNode} children of
     *   the current node
     * @return {FincNode} - newly constructed node
     */

  }, {
    key: 'constructNode',
    value: function constructNode(descInfo, childrenIds) {
      var primitive = Fetcher.Primitives[descInfo[0]];
      var currentNode = primitive.builder.apply(primitive, [descInfo].concat(_toConsumableArray(childrenIds)));

      // If scale is present, then build node for it above the current one
      var scale = parseInt(descInfo[4], 10);
      currentNode = scale === 1 ? currentNode : new finc.FincScaleNode(currentNode, scale);

      // If lowerBound is not 0, then most likely we have a timebound node
      var lowerBound = parseInt(descInfo[6], 10);
      var upperBound = parseInt(descInfo[7], 10);
      currentNode = lowerBound === 0 ? currentNode : new finc.FincTimeboundNode(currentNode, lowerBound, upperBound);

      return currentNode;
    }

    /**
     * Fetches the blockchain deployed Fincontract info given its 32-byte address.
     * Returns a promise, that resolves to the Fincontract info as defined
     * by `getFincontractInfo` function in {@link FincontractMarketplace} or
     * rejects with an Error if the Fincontract was not found.
     * @param  {String} fctID - 32-byte address of the blockchain deployed
     *   Fincontract
     * @return {Promise<String,Error>} - promise, that resolves with the info
     *   or rejects with an Error if the Fincontract was not found.
     */

  }, {
    key: 'getFincontractInfo',
    value: function getFincontractInfo(fctID) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.marketplace.getFincontractInfo(fctID, function (err, fctInfo) {
          if (err || !parseInt(fctInfo[0], 16)) {
            reject(Error('Contract was not found!'));
            return;
          }
          resolve(fctInfo);
        });
      });
    }

    /**
     * Fetches the blockchain deployed Fincontract description given
     * its 32-byte address. Returns a promise, that resolves to the Fincontract
     * description as defined by `getDescriptionInfo` function
     * in {@link FincontractMarketplace} or rejects with an Error if the whole
     * description was empty.
     * @param  {String} descID - 32-byte address of the blockchain deployed
     *   Fincontract description
     * @return {Promise<String,Error>} - promise, that resolves with the
     *   description or rejects with an Error if the description was empty.
     */

  }, {
    key: 'getDescriptionInfo',
    value: function getDescriptionInfo(descID) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.marketplace.getDescriptionInfo(descID, function (err, descInfo) {
          if (err || !descInfo.some(function (e) {
            return Boolean(parseInt(e, 16));
          })) {
            reject(Error('Description was empty!'));
            return;
          }
          resolve(descInfo);
        });
      });
    }
  }], [{
    key: 'Primitives',
    get: function get() {
      return {
        0: {
          type: 'Zero',
          childrenCount: 0,
          builder: function builder() {
            return new finc.FincZeroNode();
          }
        },
        1: {
          type: 'One',
          childrenCount: 0,
          builder: function builder(desc) {
            return new finc.FincOneNode(parseInt(desc[1], 10));
          }
        },
        2: {
          type: 'Give',
          childrenCount: 1,
          builder: function builder(desc, child) {
            return new finc.FincGiveNode(child);
          }
        },
        3: {
          type: 'And',
          childrenCount: 2,
          builder: function builder(desc, left, right) {
            return new finc.FincAndNode(left, right);
          }
        },
        4: {
          type: 'Or',
          childrenCount: 2,
          builder: function builder(desc, left, right) {
            return new finc.FincOrNode(left, right);
          }
        },
        5: {
          type: 'ScaleObs',
          childrenCount: 1,
          builder: function builder(desc, child) {
            return new finc.FincScaleObsNode(child, desc[5]);
          }
        },
        6: {
          type: 'If',
          childrenCount: 2,
          builder: function builder(desc, left, right) {
            return new finc.FincIfNode(left, right, desc[5]);
          }
        }
      };
    }
  }]);

  return Fetcher;
}();

exports.default = Fetcher;