import { NKSProblemParser } from '../problem/NKSProblemParser';
import { SimpleContestParser } from '../SimpleContestParser';

export class NKSContestParser extends SimpleContestParser {
    protected linkSelector = 'ul.nav-tabs a[href^="/zh/Problem/Details"]';
    protected problemParser = new NKSProblemParser();
    public getMatchPatterns(): string[] {
        return ['http://oi.nks.edu.cn/zh/Contest/Details*'];
    }
}