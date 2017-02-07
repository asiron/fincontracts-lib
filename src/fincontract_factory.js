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
          new FincOrNode(lChild, rChild) 
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
    let fctInfo = FincontractMarketplace.getFincontractInfo(fctId);    
    let rootDescription = FincontractFactory.PullDescription(fctInfo[3]);
    return new Fincontract(fctInfo[0], fctInfo[1], fctInfo[2], rootDescription)
  }

  static PullDescription(descId) {
    let desc = FincontractMarketplace.getDescriptionInfo(descId);
    let primitive   = FincontractFactory.PRIMITIVES[desc[0]];
    let childrenIds = desc.slice(2, 2+primitive.childCount);
    childrenIds     = childrenIds.map((id) => FincontractFactory.PullDescription(id));
    let currentNode = primitive.builder(desc, ...childrenIds);

    // if scale is present, then build node for it above the current one
    let scale = desc[4];
    return (scale != 1) ? new FincScaleNode(currentNode, scale) : currentNode;
  }
}