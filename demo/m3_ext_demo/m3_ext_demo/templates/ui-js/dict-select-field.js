/**
 * Created with PyCharm.
 * User: Игорь
 * Date: 11.07.12
 * Time: 15:11
 * To change this template use File | Settings | File Templates.
 */

var cont = win.items.items[0].items.items[0],
    btn = win.items.items[0].items.items[1];


function changeReadOnlyMode(){
    cont.setReadOnly(!cont.readOnly);
    btn.setReadOnly(!btn.readOnly);
}