package object;

import contract.*;

import java.awt.geom.Point2D;
import java.util.*;
import java.util.ArrayList;

public class BernsteinBezier implements Bezier {
    private List<List<Integer>> binomial_coefficient;

    // pre-processing
    // memoize binomial coefficient
    // calculate nCr = n-1Cr-1 + n-1Cr
    public BernsteinBezier() {
        final int size = 100;
        List<Integer> a = new ArrayList<Integer>(100);

        // initialize
        this.binomial_coefficient = new ArrayList<List<Integer>>(size + 1);
        for (int i = 0; i <= size; i++) {
            this.binomial_coefficient.add(new ArrayList<Integer>(size + 1));
            for (int j = 0; j <= size; j++) {
                this.binomial_coefficient.get(i).add(0);
            }
        }

        // set coeffisicent
        this.binomial_coefficient.get(1).set(0, 1);
        this.binomial_coefficient.get(1).set(1, 1);
        for (int i = 2; i <= size; i++) {
            for (int j = 0; j <= i; j++) {
                if (j == 0 || j == i) {
                    this.binomial_coefficient.get(i).set(j, 1);
                    continue;
                }
                // nCr = n-1Cr + n-1Cr-1
                int coefficient = this.binomial_coefficient.get(i - 1).get(j)
                        + this.binomial_coefficient.get(i - 1).get(j - 1);
                this.binomial_coefficient.get(i).set(j, coefficient);
            }
        }
    }

    public List<Point2D> execute(List<Point2D> controlPoints, int numberOfPoints) {
        List<Point2D> result = new ArrayList<Point2D>();
        for (int i = 0; i <= numberOfPoints; i++) {
            double t = (double) i / (double) numberOfPoints;
            result.add(point(controlPoints, t));
        }
        return result;
    }

    // get point recursively
    private Point2D point(List<Point2D> controlPoints, double t) {
        double x = 0;
        double y = 0;
        int dimension = controlPoints.size() - 1;

        for (int i = 0; i < controlPoints.size(); i++) {
            int coefficient = this.binomial_coefficient.get(dimension).get(i);
            x += controlPoints.get(i).getX() * coefficient * Math.pow(t, i) * Math.pow(1.0 - t, dimension - i);
            y += controlPoints.get(i).getY() * coefficient * Math.pow(t, i) * Math.pow(1.0 - t, dimension - i);
        }
        Point2D result = new Point2D.Double(x, y);
        return result;
    }
}