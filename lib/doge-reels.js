import {writers} from '../app/articles/writers';
import sources from '../scripts/week6-staging-video-sources.json';
const urls=Object.fromEntries(sources.map(v=>[v.id,v.url]));
export const dogeReels=[
  {id:"fdcc3f1e998e9d6b1526d61574dacdcf",leftKey:"470.l.226614.t.7",rightKey:"470.l.226614.t.5",short:"TRANIMAL · JERRUH",matchup:"Tranimal vs. Jerruh's World",correspondent:"Hollis Crane",avatar:writers.crane.image,videoUrl:urls["fdcc3f1e998e9d6b1526d61574dacdcf"]},
  {id:"5659121ab18da004f4099fb401111272",leftKey:"470.l.226614.t.1",rightKey:"470.l.226614.t.8",short:"CALEB · OCELLUS",matchup:"Caleb's Elite Touch Rate vs. T. Ocellus",correspondent:"Conrad Sorrell",avatar:writers.sorrell.image,videoUrl:urls["5659121ab18da004f4099fb401111272"]},
  {id:"fa1a1be16048cd9d970d063199968a5d",leftKey:"470.l.226614.t.4",rightKey:"470.l.226614.t.11",short:"EL NIÑO · ORDWAY",matchup:"El Niño Grande vs. Ordway and Son",correspondent:"Dashiell Pike",avatar:writers.pike.image,videoUrl:urls["fa1a1be16048cd9d970d063199968a5d"]},
  {id:"bb6062449d875437a6fa4c518f037b00",leftKey:"470.l.226614.t.3",rightKey:"470.l.226614.t.9",short:"BEARS · TIGHT ENDS",matchup:"RFK Jr's Bears vs. Extremely Tight Ends",correspondent:"Marnie Kells",avatar:writers.kells.image,videoUrl:urls["bb6062449d875437a6fa4c518f037b00"]},
  {id:"1633766725053b63471961b233e39f34",leftKey:"470.l.226614.t.2",rightKey:"470.l.226614.t.6",short:"GIMOTHY · KONG",matchup:"Gimothy Blossoms vs. McConkey Kong",correspondent:"Maude Gannon",avatar:writers.gannon.image,videoUrl:urls["1633766725053b63471961b233e39f34"]},
  {id:"10d87b4914e440520ffad1daab999f2f",leftKey:"470.l.226614.t.10",rightKey:"470.l.226614.t.12",short:"HASSAN · NIX",matchup:"De'Coldest Hassan vs. Nix in 5",correspondent:"Sabine March",avatar:writers.march.image,videoUrl:urls["10d87b4914e440520ffad1daab999f2f"]},
];
