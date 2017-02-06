class FincontractFactory {

  static get DEFAULT_GATEWAY() { return [1, 1.2]; }

  static get PRIMITIVES() {
    return [
      { 
        childCount: 0, 
        builder: (desc) => 
          new FincZeroNode() 
      },
      { 
        childCount: 0, 
        builder: (desc) =>
          new FincOneNode(desc[1])
      },
      { 
        childCount: 1, 
        builder: (desc, child) => 
          new FincGiveNode(child) 
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) =>
          new FincAndNode(lChild, rChild)
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) => 
          new FindOrNode(lChild, rChild) 
      },
      { 
        childCount: 1, 
        builder: (desc, child) => 
          new FincScaleObservableNode(child, FincontractFactory.DEFAULT_GATEWAY)
      },
      { 
        childCount: 2, 
        builder: (desc, lChild, rChild) => 
          new FincIfNode(lChild, rChild)
      }
    ];
  }

  static PullContract(fctId) {
    fctInfo = FincontractMarketplace.getFincontractInfo(fctId);    
    rootDescription = FincontractFactory.PullDescription(fctInfo[3]);
    return Fincontract(fctInfo[0], fctInfo[1], fctInfo[2], rootDescription)
  }

  static PullDescription(descId) {
    var desc = FincontractMarketplace.getDescriptionInfo(descId);
    var primitive   = FincontractFactory.PRIMITIVES[desc[0]];
    var childrenIds = desc.slice(2, 2+primitive.childCount);
    childrenIds     = childrenIds.map((id) => FincontractFactory.PullDescription(id));
    var currentNode = primitive.builder(desc, ...childrenIds);

    var scale = desc[4];
    return (scale != 1) ? new FincScaleNode(currentNode, scale) : currentNode;
  }
}