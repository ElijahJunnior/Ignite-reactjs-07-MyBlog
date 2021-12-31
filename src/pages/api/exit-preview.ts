import { NextApiRequest, NextApiResponse } from "next";
import * as url from 'url'

// const url: Url

export default (req: NextApiRequest, res: NextApiResponse) => {

    // Exit the current user from "Preview Mode". This function accepts no args.
    res.clearPreviewData()

    const queryObject = url.parse(req.url, true).query;
    const redirectUrl = queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

    res.writeHead(307, { Location: redirectUrl })
    res.end()
}