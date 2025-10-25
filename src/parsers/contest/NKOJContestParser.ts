import { NKOJProblemParser } from '../problem/NKOJProblemParser';
import { SimpleContestParser } from '../SimpleContestParser';

export class NKOJContestParser extends SimpleContestParser {
    protected linkSelector = 'ul.nav-tabs a[href^="/zh/Problem/Details"]';
    protected problemParser = new NKOJProblemParser();
    public getMatchPatterns(): string[] {
        return ['http://oi.nks.edu.cn/zh/Contest/Details*'];
    }
}