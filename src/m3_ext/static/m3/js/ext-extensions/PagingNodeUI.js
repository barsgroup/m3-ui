Ext.ux.PagingTreeNodeUI = Ext.extend(Ext.ux.tree.TreeGridNodeUI,
  {
    renderElements : function(n, a, targetNode, bulkRender){
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';
        var attribs = n.attributes;
        var currentBlock = parseInt(n.parentNode.attributes.page) || 0;
        var fullCount = attribs.fullCount;
        var blockSize = n.parentNode.attributes.pageLimit || attribs.limit || 25;
        n.parentNode.attributes.pageLimit = blockSize;
        var blockCount = Math.ceil(fullCount/blockSize);
        var t = n.getOwnerTree();
        var cols = t.columns;
        var  c = cols[0];
        var renderBtn = function(stringStack, pageNum, text, addlClass)
        {
          stringStack.push('<div class="gs_tree_pgbtn')
          if(addlClass)
            stringStack.push(' ' + addlClass);
          stringStack.push('"><div gs:page="');
          stringStack.push(pageNum);
          stringStack.push('" class="x-tree-col-text">');
          stringStack.push(text);
          stringStack.push('</div></div>');
        }

         var buf = [
             '<li class="gs_tree_pagingbar" style="list-style:none;"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el ', a.cls,'">',
             '<span unselectable="on" style="float:left;">Лист ',currentBlock+1, " из ", blockCount, '</span></a>'];

        var i;

        if(currentBlock!=0)
          renderBtn(buf, currentBlock-1, '<');

        if(blockCount<11)
        {
          for(i=0; i<blockCount; i++)
            renderBtn(buf, i, i+1, currentBlock==i?'gs_tree_pgbtn_sel':null);
        }
        else
        {
          // always render the link to the first page:
          renderBtn(buf, 0, 1, currentBlock==0?'gs_tree_pgbtn_sel':null);

          // render the current page link and the three links before and after:
          var from = Math.max(1, currentBlock-2);
          var to = Math.min(blockCount-1, currentBlock+3);

          if(from>1)
            buf.push('<div class="x-tree-col"><div class="x-tree-col-text">...</div></div>');

          for(i=from; i<to; i++)
            renderBtn(buf, i, i+1, currentBlock==i?'gs_tree_pgbtn_sel':null);

          if(to<blockCount-1)
            buf.push('<div class="x-tree-col"><div class="x-tree-col-text">...</div></div>');

          renderBtn(buf, blockCount-1, blockCount, currentBlock==blockCount-1?'gs_tree_pgbtn_sel':null);
        }
        if(currentBlock!=blockCount-1)
          renderBtn(buf, currentBlock+1, '>');


        var post= ['<div class="x-tree-col"><div id="last" class="x-tree-col-text">Показаны строки от ',currentBlock*blockSize+1, ' до ', Math.min((currentBlock+1)*blockSize, fullCount), " из ", fullCount, '</div></div>',
            '<div class="x-clear"></div></div>',
            '<ul class="x-tree-node-ct" style="display:none;"></ul>',
            "</li></div></td>"];

        var nodeStr = buf.join('')+post.join('');
        buf =  [
             '<tbody class="x-tree-node">',
                '<tr ext:tree-node-id="', n.id ,'" class="x-tree-node-el x-tree-node-leaf x-tree-pagingnode', a.cls, '">',
            '<td colspan="',cols.length,'" class="x-treegrid-col x-tree-pagingnode-td">',
            '<span class="x-tree-node-indent" style="float:left;">', this.indentMarkup, "</span>",
                        '<img src="', this.emptyIcon, '" class="x-tree-elbow" style="float:left;"/>',
                        '<img src="', a.icon || this.emptyIcon, '" class="', (a.icon ? " x-tree-node-inline-icon" : ""), (a.iconCls ? " "+a.iconCls : ""), '" unselectable="on" style="float:left;"/>',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : '', '>',
            nodeStr,
                    '</td>'
        ];

        nodeStr = buf.join('');

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin",
                                n.nextSibling.ui.getEl(), nodeStr);
        }
        else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, nodeStr);
        }
        n.on("click",
          function(node, evt)
          {
            var loader = node.getOwnerTree().getLoader();
            var target = evt.target;
            if(!target.attributes.getNamedItem('gs:page'))
              return false;
            var parent = node.parentNode;
            var pageLimit = parent.attributes.pageLimit || 25;
            var page = target.attributes.getNamedItem('gs:page').value;
            loader.baseParams.limit = pageLimit;
            loader.baseParams.start = page * pageLimit;
            parent.attributes.page = page;
            delete parent.attributes.children;
            parent.getUI().beforeLoad();  //display the loading icon
            loader.load(parent, function()
              {
                parent.getUI().afterLoad();  //remove the loading icon again
                parent.expand();
              });
            delete loader.baseParams.start;
            delete loader.baseParams.limit;

            return false;
          }
        );

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.firstChild.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        this.anchor = cs[3];
        this.textNode = cs[3].firstChild;
    }
});