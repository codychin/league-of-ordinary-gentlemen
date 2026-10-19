import {writers} from '../app/articles/writers';
import sources from '../scripts/week6-staging-video-sources.json';
const urls=Object.fromEntries(sources.map(v=>[v.id,v.url]));
export const sundayReels=[
  {id:"ab6a2add7e645210cb86934097a89de2",leftKey:"470.l.197826.t.9",rightKey:"470.l.197826.t.11",short:"SCRUMP · COOKIES",matchup:"Scrump vs. Tolbert's Cookies",correspondent:"Conrad Sorrell",avatar:writers.sorrell.image,videoUrl:urls["ab6a2add7e645210cb86934097a89de2"]},
  {id:"a1fa42b9841ce5cbf65dcb9f41933634",leftKey:"470.l.197826.t.5",rightKey:"470.l.197826.t.10",short:"DITKA · CHANE",matchup:"Forte inch Ditka vs. CHANE GANG",correspondent:"Hollis Crane",avatar:writers.crane.image,videoUrl:urls["a1fa42b9841ce5cbf65dcb9f41933634"]},
  {id:"fff301f2f6f68f16bf3c0356f2a72ea5",leftKey:"470.l.197826.t.7",rightKey:"470.l.197826.t.12",short:"J BIRD · RBS",matchup:"J Bird vs. RBs are Overrated",correspondent:"Maude Gannon",avatar:writers.gannon.image,videoUrl:urls["fff301f2f6f68f16bf3c0356f2a72ea5"]},
  {id:"34e5abea6115e4e978f095a148cb4962",leftKey:"470.l.197826.t.1",rightKey:"470.l.197826.t.2",short:"ZAY · STROKE",matchup:"ZAYWATCH vs. A Stroke of Bad Luck",correspondent:"Sabine March",avatar:writers.march.image,videoUrl:urls["34e5abea6115e4e978f095a148cb4962"]},
  {id:"8e17689502657953ea734f897b201002",leftKey:"470.l.197826.t.3",rightKey:"470.l.197826.t.8",short:"RHAMONDRE · WAKE",matchup:"Rhamondre - A Cautionary Tale vs. Wake Me Up On September 1st",correspondent:"Dashiell Pike",avatar:writers.pike.image,videoUrl:urls["8e17689502657953ea734f897b201002"]},
  {id:"77aaba25a1cfaa30b7f989e602623bb9",leftKey:"470.l.197826.t.4",rightKey:"470.l.197826.t.6",short:"CROATIA · ALLENTOWN",matchup:"Croatian Sensation vs. It's always sunny in ALLENtown",correspondent:"Marnie Kells",avatar:writers.kells.image,videoUrl:urls["77aaba25a1cfaa30b7f989e602623bb9"]},
];
